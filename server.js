import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";
import * as yaml from "js-yaml";
import pino from "pino";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
const log = pino({ level: process.env.LOG_LEVEL || "info" });

// --- OpenAI ---
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

// --- Middlewares ---
app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(rateLimit({ windowMs: 60_000, max: 60 }));

// --- Carrega schema e regras do GitHub ---
const SCHEMA_URL = "https://raw.githubusercontent.com/Fabricia07/fabricia-mutant-schema/main/schema.yaml";

async function loadSchema() {
  const txt = await (await fetch(SCHEMA_URL)).text();
  return yaml.load(txt);
}
async function loadRuleDocs(urls) {
  const texts = await Promise.all(urls.map(async (u) => (await fetch(u)).text()));
  return texts.join("\n\n---\n\n");
}

let schema = await loadSchema();
const ruleDocs = await loadRuleDocs(schema["x-rules"] || []);

// --- Whitelist/Blacklist helpers ---
const XW = schema["x-wilmington"] || {};
const BASE_BLACKLIST = new Set([...(XW.blacklist || [])]);

function geoValidate(text, { whitelist = [], blacklist = [] } = {}) {
  const wl = new Set(whitelist);
  const bl = new Set([...BASE_BLACKLIST, ...blacklist]);

  const locaisDetectados = Array.from(wl).filter((l) => text.includes(l));
  const foraDaWhitelist = [...text.matchAll(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*\b/g)]
    .map((m) => m[0])
    .filter((tok) => tok.length > 3 && !wl.has(tok))
    .slice(0, 50);

  const termosBanidos = Array.from(bl).filter((b) => text.includes(b));

  return { locaisDetectados, foraDaWhitelist, termosBanidos };
}

function simpleHash(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return String(h);
}

// --- Diagnóstico ---
app.get("/", (_req, res) => res.type("text/plain").send("MUTANT_SUPREME_EN online"));
app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    schemaLoaded: !!schema,
    docsHash: simpleHash(ruleDocs),
    hasWhitelistSource: !!(schema["x-wilmington"]?.whitelistSource),
    model: OPENAI_MODEL,
  });
});
app.get("/_docs", (_req, res) => res.type("text/plain").send(ruleDocs));

// --- /mutate ---
app.post("/mutate", async (req, res) => {
  try {
    const {
      textoPT,
      dna,
      timeline,
      enforceWhitelist = true,
      whitelistOverride = [],
      blacklistOverride = [],
    } = req.body || {};

    if (!textoPT || !dna) {
      return res.status(400).json({ error: "textoPT e dna são obrigatórios" });
    }

    // 1) whitelist carregada do repo
    const wlSource = schema["x-wilmington"]?.whitelistSource;
    let wlText = "";
    if (wlSource) wlText = await (await fetch(wlSource)).text();
    const whitelist = [...new Set((wlText.match(/^[^\n]+$/gm) || []).map((s) => s.trim()))]
      .filter(Boolean)
      .concat(whitelistOverride);

    // 2) validação geográfica
    const geo = geoValidate(textoPT, { whitelist, blacklist: blacklistOverride });
    const geoFail = (enforceWhitelist && geo.foraDaWhitelist.length > 0) || geo.termosBanidos.length > 0;

    // 3) montar prompt (ordem: mutações > dna > ambientação > protocolos > regras)
    const rulesIndex = (schema["x-rules"] || []).reduce((acc, url) => {
      acc[url.split("/").pop()] = url; // mutacoes.md, dna.md, ...
      return acc;
    }, {});
    async function fetchRaw(url) {
      return (await fetch(url)).text();
    }
    const wanted = ["mutacoes.md", "dna.md", "ambientacao.md", "protocolos.md", "regras-mestras.md"];
    const orderedDocs = [];
    for (const name of wanted) {
      const url = rulesIndex[name];
      if (url) orderedDocs.push(`### ${name}\n\n${await fetchRaw(url)}`);
    }
    const docsForPrompt = orderedDocs.join("\n\n---\n\n");

    const systemMsg = [
      "Você é o agente MUTANT_SUPREME_EN.",
      "Aplique SEMPRE as mutações (De/Para) para Wilmington, NC.",
      "Use SOMENTE os 19 personagens do dna.md (nomes/idades/profissões/relações exatas).",
      "Use apenas locais REAIS de Wilmington (whitelist) e evite blacklist.",
      "Aplique o protocolo de luto americano quando a timeline indicar morte.",
      "Saída obrigatória: ROTEIRO_EN, TITLES_AB (2), SHORTS (3) e SENTRY (JSON hints).",
    ].join(" ");

    const userMsg = `
[INPUT_PT]
${textoPT}

[TIMELINE]
${timeline || "(não informado)"}

[REGRAS]
${docsForPrompt}

[FORMATO_DE_SAIDA]
<<<ROTEIRO_EN>>>
... texto em inglês cinematográfico (aprox. 5:30) ...
<<<TITLES_AB>>>
- Título A
- Título B
<<<SHORTS>>>
- Frase curta 1 (<=280)
- Frase curta 2 (<=280)
- Frase curta 3 (<=280)
<<<SENTRY_HINTS>>>
Liste brevemente itens aplicados (locais, clima, personagens, cliffhangers).
`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.5,
      messages: [
        { role: "system", content: systemMsg },
        { role: "user", content: userMsg },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    log.info({ rawModel: raw }, "OpenAI raw output");

    // 4) parsing seguro por tags
    function between(tag, src) {
      const re = new RegExp(`<<<${tag}>>>\\s*([\\s\\S]*?)\\s*(?=<<<|$)`, "m");
      const m = src.match(re);
      return m ? (m[1] || "").trim() : "";
    }
    const roteiroEN = between("ROTEIRO_EN", raw);
    const titlesBlock = between("TITLES_AB", raw);
    const shortsBlock = between("SHORTS", raw);

    const aberturaAB = titlesBlock
      .split("\n")
      .map((s) => s.replace(/^-+\s*/, "").replace(/^-?\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 2);

    const shorts = shortsBlock
      .split("\n")
      .map((s) => s.replace(/^-+\s*/, "").replace(/^-?\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    // 5) SENTRY
    const relatorioSENTRY = {
      status: geoFail ? "FAIL" : "PASS",
      resumo: geoFail ? "Ajustes necessários na geografia/termos banidos." : "Conforme.",
      geografia: { whitelistAtivada: !!enforceWhitelist, ...geo },
      dna: {
        personagensUsados: [], // opcional
        personagensNaoAutorizados: [],
        inconsistencias: [],
      },
      atmosfera: {
        elementosAplicados: [],
        faltantes: [],
      },
      cliffhangers: { contagem: 0, marcasDeTempo: [] },
      output: { titlesAB: aberturaAB, frasesShorts: shorts },
      violacoes: [],
    };

    return res.json({
      roteiroEN,
      aberturaAB,
      shorts,
      relatorioSENTRY,
      // debugRaw: raw, // (opcional: remova em produção)
    });
  } catch (e) {
    log.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
});

// --- stubs extras ---
app.post("/revise", (_req, res) => res.json({ trechoRevisado: "[TEXTO REVISADO]" }));
app.post("/ctrtest", (_req, res) =>
  res.json({ ctrPrevisto: "10-14%", sugestaoMelhoria: "Use um curiosity gap nos 7 primeiros segundos." })
);

// --- start ---
const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Mutant server on :${port}`));
