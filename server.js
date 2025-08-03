const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// MUTATE
app.post("/mutate", (req, res) => {
  const { textoPT, dna, timeline } = req.body;
  res.json({
    roteiroEN: `Mutated version of: ${textoPT} | DNA: ${dna} | Timeline: ${timeline}`,
    aberturaAB: [
      "She thought it was just another morning...",
      "March 15: The last morning Ethan ever came downstairs."
    ],
    shorts: [
      "One morning changed everything.",
      "Grief doesn’t wait.",
      "Silence louder than words."
    ],
    relatorioSENTRY: "✅ DNA, Timeline e Cultura aplicados."
  });
});

// REVISE
app.post("/revise", (req, res) => {
  const { trechoEN } = req.body;
  res.json({
    trechoRevisado: `Revised: ${trechoEN}`
  });
});

// CTR TEST
app.post("/ctrtest", (req, res) => {
  const { titulo, thumbnailDescricao } = req.body;
  res.json({
    ctrPrevisto: "Alto",
    sugestaoMelhoria: `Título "${titulo}" com thumbnail "${thumbnailDescricao}" pode ter CTR maior com contraste mais forte.`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
