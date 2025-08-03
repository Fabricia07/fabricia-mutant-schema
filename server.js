import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Rota /mutate
app.post("/mutate", (req, res) => {
  const { textoPT, dna, timeline } = req.body;
  res.json({
    roteiroEN: `🎬 Mutated (EN Cinematic): ${textoPT}\nDNA: ${dna}\nTimeline: ${timeline}`,
    aberturaAB: [
      "She thought the funeral was the end. She was wrong.",
      "The silence after Ethan’s death was louder than any storm."
    ],
    shorts: [
      "Grief doesn’t knock. It breaks in.",
      "Two days later, the silence screamed louder.",
      "When the night falls, memories don’t rest."
    ],
    relatorioSENTRY: "✅ DNA, Timeline, Cultura Americana aplicados."
  });
});

// Rota /revise
app.post("/revise", (req, res) => {
  const { trechoEN } = req.body;
  res.json({
    trechoRevisado: `📖 Revised for US cinematic flow: ${trechoEN}`
  });
});

// Rota /ctrtest
app.post("/ctrtest", (req, res) => {
  const { titulo, thumbnailDescricao } = req.body;
  res.json({
    ctrPrevisto: "High CTR predicted",
    sugestaoMelhoria: `Consider adding suspense keywords to "${titulo}" with thumbnail: ${thumbnailDescricao}`
  });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`🚀 Server running on port ${port}`));
