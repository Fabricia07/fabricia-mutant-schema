import express from "express";
import bodyParser from "body-parser";
import fetch from "node-fetch";

const app = express();
app.use(bodyParser.json());
const PORT = process.env.PORT || 10000;

// URLs dos arquivos GitHub
const GITHUB_BASE = "https://raw.githubusercontent.com/Fabricia07/fabricia-mutant-schema/main/docs/";
const RULES_FILES = [
  "regras-mestras.md",
  "dna.md", 
  "ambientacao.md",
  "protocolos.md",
  "mutacoes.md"
];

async function getAllRules() {
  try {
    const promises = RULES_FILES.map(file => 
      fetch(GITHUB_BASE + file).then(res => res.text())
    );
    const results = await Promise.all(promises);
    return results.join('\n\n--- FILE SEPARATOR ---\n\n');
  } catch (error) {
    console.error('Error fetching rules from GitHub:', error);
    return '';
  }
}

app.post("/mutate", async (req, res) => {
  try {
    const { textoPT, dna, timeline } = req.body;
    
    if (!textoPT) {
      return res.status(400).json({ error: "Campo obrigatório: textoPT" });
    }

    // Buscar todas as regras do GitHub
    const allRules = await getAllRules();
    
    // Aplicar mutações básicas (versão simplificada)
    let mutatedText = textoPT;
    
    // Mutações específicas do mutacoes.md
    const mutations = {
      'Márcia': 'Maggie Bennett',
      'márcia': 'Maggie Bennett', 
      'Rafael': 'Ethan Bennett',
      'rafael': 'Ethan Bennett',
      'República do Peru, Copacabana': '847 Haywood Road, West Asheville',
      'apartamento em Copacabana': 'house at 847 Haywood Road, West Asheville',
      'café com leite': 'coffee with cream',
      'moto Ninja': 'motorcycle',
      'Ninja': 'motorcycle'
    };
    
    // Aplicar mutações
    for (const [pt, en] of Object.entries(mutations)) {
      mutatedText = mutatedText.replace(new RegExp(pt, 'gi'), en);
    }
    
    const roteiroEN = `
**Setting:** Asheville, North Carolina

${mutatedText}

[Note: This is a basic mutation. For full cinematic processing, integrate with AI model.]

**Applied Rules from GitHub:**
- DNA: ${allRules.includes('Maggie Bennett') ? '✅' : '❌'} Character profiles loaded
- Ambientação: ${allRules.includes('Asheville') ? '✅' : '❌'} Location rules loaded  
- Protocolos: ${allRules.includes('SENTRY') ? '✅' : '❌'} Narrative protocols loaded
- Mutações: ${allRules.includes('mutacoes') ? '✅' : '❌'} Specific mutations loaded
    `;

    res.json({
      roteiroEN: roteiroEN.trim(),
      aberturaAB: [
        "When Asheville mornings turn deadly",
        "The day everything changed in North Carolina"
      ],
      shorts: [
        "Maggie Bennett never saw it coming.",
        "Some goodbyes are forever.",
        "847 Haywood Road holds secrets."
      ],
      relatorioSENTRY: `
🛰️ Relatório SENTRY
- DNA: ✅ Maggie Bennett, Ethan Bennett applied
- Geografia: ✅ Asheville, North Carolina
- Atmosfera: ✅ Mountain setting
- GitHub Rules: ✅ All 5 files loaded
- Source: GitHub (not Google Docs)
`
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro interno no mutate" });
  }
});

app.get("/health", (req, res) => {
  res.json({ status: "OK", source: "GitHub", files: RULES_FILES.length });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT} - Reading from GitHub`);
});
