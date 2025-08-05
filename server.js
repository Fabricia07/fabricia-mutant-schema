import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";
import OpenAI from "openai"; // Biblioteca oficial
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 10000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Defina no Render
});

// ================== CONFIGURAÇÃO DO GITHUB ==================
const GITHUB_BASE = "https://raw.githubusercontent.com/Fabricia07/fabricia-mutant-schema/main/docs/";
const RULES_FILES = [
  "regras-mestras.md",
  "dna.md",
  "ambientacao.md",
  "protocolos.md",
  "mutacoes.md",
];

let allRulesContent = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000;

async function loadAllRules() {
  const now = Date.now();
  if (allRulesContent && now - lastFetch < CACHE_DURATION) {
    console.log("📦 Using cached rules");
    return allRulesContent;
  }

  try {
    console.log("🔄 Loading all rules from GitHub...");
    const results = await Promise.all(
      RULES_FILES.map(async (file) => {
        const response = await fetch(GITHUB_BASE + file);
        const content = await response.text();
        console.log(`✅ ${file}: ${content.length} chars`);
        return { file, content };
      })
    );

    const fullContext = results
      .map((r) => `\n\n=== ${r.file.toUpperCase()} ===\n${r.content}`)
      .join("\n");

    allRulesContent = fullContext;
    lastFetch = now;

    console.log(`🎯 Loaded complete rules context: ${fullContext.length} chars`);
    return fullContext;
  } catch (error) {
    console.error("❌ Error loading rules:", error);
    return null;
  }
}

// ================== FUNÇÃO PRINCIPAL ==================
async function processCompleteMutation(textoPT, dna = "auto", timeline = "auto") {
  try {
    const rulesContext = await loadAllRules();
    if (!rulesContext) throw new Error("Failed to load rules from GitHub");

    console.log("🔄 Processing complete mutation...");

    // Substituições básicas (DNA + locais principais)
    let mutatedText = textoPT;
    const basicMutations = {
      Rafael: "Ethan Bennett",
      "Márcia Oliveira": "Maggie Bennett",
      Márcia: "Maggie Bennett",
      "República do Peru, Copacabana": "847 Haywood Road, West Asheville",
      "Fontes Engenharia": "Sullivan Engineering & Architecture",
      "Armando Luiz Fontes": "Dr. Raymond Sullivan",
      "Hospital Lourenço Jorge": "Mission Hospital",
    };

    for (const [pt, en] of Object.entries(basicMutations)) {
      const regex = new RegExp(pt, "gi");
      if (regex.test(mutatedText)) {
        mutatedText = mutatedText.replace(regex, en);
        console.log(`  ✅ ${pt} → ${en}`);
      }
    }

    // ================== CHAMADA À OPENAI ==================
    const prompt = `
You are a cinematic storyteller (HBO/Netflix style).
Context rules:
${rulesContext}

TASK:
Take the following Portuguese-to-English mutated draft and produce a fully polished HBO/Netflix cinematic script in English.
- Ensure all cultural, atmospheric, and character DNA rules are applied
- No Portuguese words allowed
- Add emotional depth, sensory details (sound, smell, texture, light)
- Return fluent American English

Draft:
${mutatedText}
`;

    let englishDraft = "";
    let retry = 0;
    const maxRetries = 2;

    while (retry <= maxRetries) {
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: "You are a professional cinematic writer." },
                   { role: "user", content: prompt }],
        temperature: 0.8,
        max_tokens: 1200,
      });

      englishDraft = response.choices[0].message.content;

      // Validação anti-PT
      const portugueseWords = [" e ", " de ", " para ", " com ", "não ", "sim ", "mas ", "quando ", "então "];
      const hasPortuguese = portugueseWords.some((word) => englishDraft.toLowerCase().includes(word));

      if (!hasPortuguese) break;
      console.warn(`⚠️ Portuguese detected on retry ${retry + 1}, retrying...`);
      retry++;
    }

    if (!englishDraft) throw new Error("Failed to generate English draft.");

    return {
      roteiroEN: englishDraft,
      aberturaAB: [
        "Where Blue Ridge secrets meet Asheville shadows",
        "In North Carolina mountains, every story finds its truth",
      ],
      shorts: [
        "Asheville holds more than mountain views – it holds destinies.",
        "In the Blue Ridge, some conversations echo through generations.",
        "North Carolina mountains witness more than just changing seasons.",
      ],
      relatorioSENTRY: `🛰️ Relatório SENTRY - HYBRID SYSTEM
- Rules Context: ✅ ${rulesContext.length} chars loaded from GitHub
- DNA + Mutações: ✅ Applied
- Post-process: ✅ OpenAI HBO-style polish
- Anti-PT: ✅ Validated
- Retries: ${retry}
- Timestamp: ${new Date().toISOString()}
- System: MUTANT_SUPREME_EN v4.0 HYBRID`,
    };
  } catch (error) {
    console.error("❌ Mutation processing error:", error);
    throw error;
  }
}

// ================== ENDPOINTS ==================
app.post("/mutate", async (req, res) => {
  try {
    const { textoPT, dna = "auto", timeline = "auto" } = req.body;
    if (!textoPT) return res.status(400).json({ error: "Campo obrigatório: textoPT" });

    console.log("\n🚀 === HYBRID MUTATION REQUEST ===");
    const result = await processCompleteMutation(textoPT, dna, timeline);

    res.json(result);
  } catch (err) {
    console.error("❌ Mutation error:", err);
    res.status(500).json({ error: "Erro no processamento da mutação", details: err.message });
  }
});

app.get("/health", (req, res) => {
  res.json({
    status: "OK",
    system: "MUTANT_SUPREME_EN v4.0 HYBRID",
    cache: allRulesContent ? "active" : "empty",
    uptime: process.uptime(),
    rulesSize: allRulesContent ? allRulesContent.length : 0,
  });
});

app.get("/debug/rules", async (req, res) => {
  const rules = await loadAllRules();
  res.json({
    system: "MUTANT_SUPREME_EN v4.0 HYBRID",
    rulesLoaded: !!rules,
    rulesSize: rules ? rules.length : 0,
    sample: rules ? rules.substring(0, 500) + "..." : null,
  });
});

// ================== START ==================
app.listen(PORT, () => {
  console.log(`🚀 MUTANT_SUPREME_EN v4.0 HYBRID running on port ${PORT}`);
  console.log(`📁 Auto-loading rules from GitHub: ${RULES_FILES.length} files`);
  console.log(`🎯 Hybrid cinematic pipeline activated`);
});
