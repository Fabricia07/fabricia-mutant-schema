const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

app.use(bodyParser.json());

app.post('/mutate', async (req, res) => {
  try {
    // Buscar conteúdo do Docs
    const regrasDocs = await axios.get("https://docs.google.com/document/d/1GR7d34JmC-LYyO0hpc-lPtgBBzuSMDntYlYTceOi6xY/export?format=txt")
      .then(res => res.data);

    // Se timeline não for enviada, extrair automaticamente
    let timeline = req.body.timeline;
    if (!timeline) {
      const match = regrasDocs.match(/## 🗓️ Linha do Tempo([\s\S]*?)(##|$)/);
      timeline = match ? match[1].trim() : "Linha do tempo não especificada no Docs";
    }

    const payload = {
      textoPT: req.body.textoPT,
      dna: req.body.dna,
      timeline: timeline,
      regrasDocs: regrasDocs
    };

    // Simulação de mutação (troque pela sua função real de mutação)
    const result = {
      roteiroEN: "Cena mutada com base no texto fornecido.",
      aberturaAB: ["Option A", "Option B"],
      shorts: ["Frase 1", "Frase 2", "Frase 3"],
      relatorioSENTRY: "DNA ✅ | Timeline ✅ | Cultura Americana ✅"
    };

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
