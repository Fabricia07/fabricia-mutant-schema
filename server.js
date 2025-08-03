import express from "express";
import bodyParser from "body-parser";

const app = express();
const PORT = process.env.PORT || 10000;

app.use(bodyParser.json());

// ✅ Rota de mutação
app.post("/mutate", (req, res) => {
  const { textoPT, dna, timeline } = req.body;

  if (!textoPT || !dna || !timeline) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes" });
  }

  // Aqui você colocaria a lógica real da mutação
  const roteiroEN = `🎬 Roteiro (EN) baseado no DNA: ${dna}, Timeline: ${timeline}\n\nTexto: ${textoPT}`;

  const resposta = {
    roteiroEN,
    aberturaAB: [
      "Option A: The day everything changed.",
      "Option B: Silence louder than words."
    ],
    shorts: [
      "Some mornings change everything.",
      "Silence can be unbearable.",
      "Grief doesn’t wait."
    ],
    relatorioSENTRY: "DNA, Timeline e Cultura Americana aplicados."
  };

  res.json(resposta);
});

// ✅ Rota de revisão
app.post("/revise", (req, res) => {
  const { trechoEN } = req.body;

  if (!trechoEN) {
    return res.status(400).json({ error: "TrechoEN é obrigatório" });
  }

  res.json({
    trechoRevisado: `${trechoEN} (revisado para fluidez americana)`
  });
});

// ✅ Rota de CTR test
app.post("/ctrtest", (req, res) => {
  const { titulo, thumbnailDescricao } = req.body;

  if (!titulo || !thumbnailDescricao) {
    return res.status(400).json({ error: "Título e thumbnail são obrigatórios" });
  }

  res.json({
    ctrPrevisto: "Alto",
    sugestaoMelhoria: `Considere adicionar mais emoção ao título: "${titulo} - The Untold Story"`
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
