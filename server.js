import express from "express";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// Rota MUTATE
app.post("/mutate", (req, res) => {
  const { textoPT, dna, timeline } = req.body;

  // Simulação de resposta cinematográfica (placeholder)
  const response = {
    roteiroEN: `🎬 Adapted Cinematic Scene for Maggie Bennett: ${textoPT}`,
    aberturaAB: [
      "Option A: The day everything changed.",
      "Option B: Silence louder than words."
    ],
    shorts: [
      "Some mornings change everything.",
      "Silence can be unbearable.",
      "Grief doesn’t wait."
    ],
    relatorioSENTRY: `DNA usado: ${dna}. Timeline: ${
      timeline || "auto from Docs"
    }`
  };

  res.json(response);
});

// Rota REVISE
app.post("/revise", (req, res) => {
  const { trechoEN } = req.body;
  res.json({
    trechoRevisado: `${trechoEN} (revised for American cultural fluency)`
  });
});

// Rota CTRTEST
app.post("/ctrtest", (req, res) => {
  const { titulo, thumbnailDescricao } = req.body;
  res.json({
    ctrPrevisto: "6.5%",
    sugestaoMelhoria: `Consider shortening title: "${titulo}" for stronger CTR.`
  });
});

// Rota padrão para teste no navegador
app.get("/", (req, res) => {
  res.send("✅ MUTANT_SUPREME_EN is live and ready for /mutate, /revise, /ctrtest!");
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
