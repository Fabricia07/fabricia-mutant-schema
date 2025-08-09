import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";
import * as yaml from "js-yaml";
import pino from "pino";
import dotenv from "dotenv";
dotenv.config();

const app = express();
const log = pino({ level: process.env.LOG_LEVEL || "info" });

app.use(helmet());
app.use(cors());
app.use(bodyParser.json({ limit: "2mb" }));
app.use(rateLimit({ windowMs: 60_000, max: 60 }));

// Carrega schema e regras
const SCHEMA_URL = "https://raw.githubusercontent.com/Fabricia07/fabricia-mutant-schema/main/schema.yaml";
async function loadSchema() {
  const txt = await (await fetch(SCHEMA_URL)).text();
  return yaml.load(txt);
}
async function loadRuleDocs(urls) {
  const texts = await Promise.all(urls.map(async u => (await fetch(u)).text()));
  return texts.join("\n\n---\n\n");
}

let schema = await loadSchema();
const ruleDocs = await loadRuleDocs(schema["x-rules"] || []);

// Helpers de whitelist/blacklist
const XW = schema["x-wilmington"] || {};
const BASE_BLACKLIST = new Set([...(XW.blacklist || [])]);

function geoValidate(text, { whitelist = [], blacklist = [] } = {}) {
  const wl = new Set(whitelist);
  const bl = new Set([...BASE_BLACKLIST, ...blacklist]);

  const locaisDetectados = Array.from(wl).filter(l => text.includes(l));
  const foraDaWhitelist = [...text.matchAll(/\b[A-Z][a-zA-Z]+(?:\s[A-Z][a-zA-Z]+)*\b/g)]
    .map(m => m[0])
    .filter(tok => tok.length > 3 && !wl.has(tok))
    .slice(0, 50);

  const termosBanidos = Array.from(bl).filter(b => text.includes(b));

  return { locaisDetectados, foraDaWhitelist, termosBanidos };
}

// ROTAS
app.post("/mutate", async (req, res) => {
  try {
    const {
      textoPT,
      dna,
      timeline,
      enforceWhitelist = true,
      whitelistOverride = [],
      blacklistOverride = []
    } = req.body || {};

    if (!textoPT || !dna) return res.status(400).json({ error: "textoPT e dna são obrigatórios" });

    // 1) Validação geográfica
    const wlSource = schema["x-wilmington"]?.whitelistSource;
    let wlText = "";
    if (wlSource) wlText = await (await fetch(wlSource)).text();
    const whitelist = [...new Set((wlText.match(/^[^\n]+$/gm) || []).map(s => s.trim()))].filter(Boolean).concat(whitelistOverride);

    const geo = geoValidate(textoPT, { whitelist, blacklist: blacklistOverride });

    // 2) Se tiver FAIL geográfico (termo banido), já sinaliza (ainda produzimos output)
    const geoFail = (enforceWhitelist && geo.foraDaWhitelist.length > 0) || geo.termosBanidos.length > 0;

    // 3) >>> Aqui entra sua chamada ao OpenAI para mutação (omitida por brevidade)
    const roteiroEN = "[ROTEIRO EN AQUI]";
    const aberturaAB = ["Title A", "Title B"];
    const shorts = ["Short 1", "Short 2", "Short 3"];

    // 4) Monta SENTRY
    const relatorioSENTRY = {
      status: geoFail ? "FAIL" : "PASS",
      resumo: geoFail ? "Ajustes necessários na geografia/termos banidos." : "Conforme.",
      geografia: { whitelistAtivada: !!enforceWhitelist, ...geo },
      dna: {
        personagensUsados: [], // preencher após parsing
        personagensNaoAutorizados: [],
        inconsistencias: []
      },
      atmosfera: {
        elementosAplicados: [], // coastal mist, golden coastal light, etc.
        faltantes: []
      },
      cliffhangers: { contagem: 0, marcasDeTempo: [] },
      output: { titlesAB: aberturaAB, frasesShorts: shorts },
      violacoes: []
    };

    return res.json({ roteiroEN, aberturaAB, shorts, relatorioSENTRY });
  } catch (e) {
    log.error(e);
    return res.status(500).json({ error: "Internal error" });
  }
});

app.post("/revise", (req, res) => {
  // mantém a mesma assinatura; ajuste sua lógica atual aqui
  res.json({ trechoRevisado: "[TEXTO REVISADO]" });
});

app.post("/ctrtest", (req, res) => {
  // stub simples
  res.json({ ctrPrevisto: "10-14%", sugestaoMelhoria: "Use um curiosity gap nos 7 primeiros segundos." });
});

const port = process.env.PORT || 8080;
app.listen(port, () => console.log(`Mutant server on :${port}`));
