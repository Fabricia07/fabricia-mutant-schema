import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 10000;

// URL do seu Docs
const RULES_URL = "https://docs.google.com/document/d/1GR7d34JmC-LYyO0hpc-lPtgBBzuSMDntYlYTceOi6xY/export?format=txt";

async function getRules() {
  const res = await fetch(RULES_URL);
  return res.text();
}

app.post("/mutate", async (req, res) => {
  try {
    const { textoPT, dna, timeline } = req.body;
    const rules = await getRules();

    if (!textoPT || !dna) {
      return res.status(400).json({ error: "Campos obrigatórios: textoPT e dna" });
    }

    // Geração simulada (substituir por modelo real depois)
    const roteiroEN = `
Scene set in Asheville, North Carolina.
DNA applied: ${dna}
Timeline: ${timeline || "Default from Docs"}
Rules enforced: Asheville only.

Texto Original:
${textoPT}
    `;

    res.json({
      roteiroEN,
      aberturaAB: [
        "The morning Asheville changed forever.",
        "When silence speaks louder than words."
      ],
      shorts: [
        "Grief doesn’t wait.",
        "Some mornings break you.",
        "In Asheville, silence can be heavy."
      ],
      relatorioSENTRY: `
✅ DNA aplicado
✅ Timeline: ${timeline || "Default"}
✅ Cidade: Asheville, NC
✅ Regras lidas do Docs (${RULES_URL})
`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no mutate" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
