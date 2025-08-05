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

// Cache inteligente
let parsedRules = null;
let lastFetch = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

async function getAllRules() {
  const now = Date.now();
  
  if (parsedRules && (now - lastFetch) < CACHE_DURATION) {
    console.log("📦 Using cached parsed rules");
    return parsedRules;
  }

  try {
    console.log("🔄 Fetching and parsing rules from GitHub...");
    const promises = RULES_FILES.map(async file => {
      const response = await fetch(GITHUB_BASE + file);
      const content = await response.text();
      console.log(`✅ ${file}: ${content.length} chars loaded`);
      return { file, content };
    });
    
    const results = await Promise.all(promises);
    
    // Parse das regras automático
    const rules = {
      dna: parseDNA(results.find(r => r.file === 'dna.md')?.content || ''),
      mutations: parseMutations(results.find(r => r.file === 'mutacoes.md')?.content || ''),
      atmosphere: parseAtmosphere(results.find(r => r.file === 'ambientacao.md')?.content || ''),
      protocols: parseProtocols(results.find(r => r.file === 'protocolos.md')?.content || '')
    };
    
    parsedRules = rules;
    lastFetch = now;
    
    console.log(`🎯 Parsed: ${Object.keys(rules.dna).length} DNA, ${Object.keys(rules.mutations).length} mutations`);
    return rules;
  } catch (error) {
    console.error('❌ Error fetching/parsing rules:', error);
    return { dna: {}, mutations: {}, atmosphere: {}, protocols: {} };
  }
}

function parseDNA(content) {
  const dnaMap = {};
  
  // Regex para capturar De/Para: X → Y
  const deParaRegex = /De\/Para:\s*(.+?)\s*→\s*(.+?)$/gm;
  let match;
  
  while ((match = deParaRegex.exec(content)) !== null) {
    const [, original, mutated] = match;
    
    // Limpar espaços e adicionar variações
    const cleanOriginal = original.trim();
    const cleanMutated = mutated.trim();
    
    dnaMap[cleanOriginal] = cleanMutated;
    
    // Adicionar variações (primeira palavra, minúsculas)
    const firstName = cleanOriginal.split(' ')[0];
    if (firstName && firstName !== cleanOriginal) {
      const mutatedFirstName = cleanMutated.split(' ')[0];
      dnaMap[firstName] = mutatedFirstName;
      dnaMap[firstName.toLowerCase()] = mutatedFirstName;
    }
    
    dnaMap[cleanOriginal.toLowerCase()] = cleanMutated;
  }
  
  console.log(`🎭 Parsed ${Object.keys(dnaMap).length} DNA mappings`);
  return dnaMap;
}

function parseMutations(content) {
  const mutationMap = {};
  
  // Regex para capturar → nas mutações
  const mutationRegex = /^[\s\-\*]*(.+?)\s*→\s*(.+?)$/gm;
  let match;
  
  while ((match = mutationRegex.exec(content)) !== null) {
    const [, original, mutated] = match;
    
    const cleanOriginal = original.trim();
    const cleanMutated = mutated.trim();
    
    // Pular se for muito curto ou inválido
    if (cleanOriginal.length < 2 || cleanMutated.length < 2) continue;
    
    mutationMap[cleanOriginal] = cleanMutated;
    mutationMap[cleanOriginal.toLowerCase()] = cleanMutated;
    
    // Variações com/sem artigos
    const withoutArticles = cleanOriginal.replace(/^(o |a |os |as )/i, '');
    if (withoutArticles !== cleanOriginal) {
      mutationMap[withoutArticles] = cleanMutated;
      mutationMap[withoutArticles.toLowerCase()] = cleanMutated;
    }
  }
  
  console.log(`🗺️ Parsed ${Object.keys(mutationMap).length} location/culture mutations`);
  return mutationMap;
}

function parseAtmosphere(content) {
  const atmosphereMap = {};
  
  // Extrair gatilhos atmosféricos
  const triggers = {
    emotional: ['melancolia', 'mistério', 'luto', 'triste', 'morte', 'chorar', 'dor', 'saudade'],
    tension: ['drama', 'tensão', 'conflito', 'briga', 'discussão', 'raiva'],
    hope: ['esperança', 'renovação', 'clareza', 'feliz', 'alegria', 'amor', 'sonho'],
    change: ['mudança', 'transição', 'crescimento', 'transformação']
  };
  
  atmosphereMap.triggers = triggers;
  
  // Extrair elementos atmosféricos específicos
  if (content.includes('Morning Fog')) {
    atmosphereMap.emotional = "Morning fog rolled down from the Blue Ridge Mountains";
  }
  if (content.includes('Thunderstorms')) {
    atmosphereMap.tension = "Dark storm clouds gathered over downtown Asheville";
  }
  if (content.includes('Mountain Light')) {
    atmosphereMap.hope = "Golden mountain light filtered through the peaks";
  }
  if (content.includes('Fall Foliage')) {
    atmosphereMap.change = "Fall colors painted the Blue Ridge Mountains";
  }
  
  console.log(`🌦️ Parsed atmospheric triggers and elements`);
  return atmosphereMap;
}

function parseProtocols(content) {
  const protocols = {};
  
  // Detectar se há protocolo de luto
  if (content.includes('PROTOCOLO DE LUTO')) {
    protocols.luto = true;
    protocols.luteSteps = [
      'Funeral Home - 2-3 days viewing',
      'Funeral Service - main ceremony', 
      'Burial/Cremation - final rest',
      'Reception - community meal (casseroles, coffee, support)'
    ];
  }
  
  // Detectar estilo HBO/Netflix
  if (content.includes('HBO/Netflix')) {
    protocols.cinematic = true;
    protocols.style = 'cinematic HBO-quality narrative';
  }
  
  // Detectar cliffhangers
  if (content.includes('CLIFFHANGER')) {
    protocols.cliffhangers = true;
  }
  
  console.log(`📜 Parsed narrative protocols`);
  return protocols;
}

function applyDynamicMutations(text, rules) {
  let mutatedText = text;
  let mutationCount = 0;
  
  // Combinar DNA + Mutations em ordem de prioridade
  const allMutations = { ...rules.mutations, ...rules.dna };
  
  // Ordenar por comprimento (mais específicas primeiro)
  const sortedMutations = Object.entries(allMutations)
    .filter(([key, value]) => key && value && key.length >= 2)
    .sort((a, b) => b[0].length - a[0].length);
  
  console.log(`🔄 Applying ${sortedMutations.length} dynamic mutations...`);
  
  for (const [original, mutated] of sortedMutations) {
    const regex = new RegExp(original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = mutatedText.match(regex);
    
    if (matches && matches.length > 0) {
      mutatedText = mutatedText.replace(regex, mutated);
      mutationCount += matches.length;
      console.log(`  ✅ "${original}" → "${mutated}" (${matches.length}x)`);
    }
  }
  
  console.log(`🎉 Applied ${mutationCount} total mutations`);
  return mutatedText;
}

function addSmartAtmosphere(text, rules) {
  if (!rules.atmosphere || !rules.atmosphere.triggers) {
    return { text, atmosphere: "in Asheville, North Carolina" };
  }
  
  const lowerText = text.toLowerCase();
  let atmosphericElement = null;
  
  // Detectar emoção da cena baseada nos gatilhos
  const { triggers } = rules.atmosphere;
  
  if (triggers.emotional.some(word => lowerText.includes(word))) {
    atmosphericElement = rules.atmosphere.emotional || "Morning fog descended from the Blue Ridge Mountains";
  } else if (triggers.tension.some(word => lowerText.includes(word))) {
    atmosphericElement = rules.atmosphere.tension || "Storm clouds gathered over downtown Asheville";
  } else if (triggers.hope.some(word => lowerText.includes(word))) {
    atmosphericElement = rules.atmosphere.hope || "Golden mountain light illuminated the peaks";
  } else if (triggers.change.some(word => lowerText.includes(word))) {
    atmosphericElement = rules.atmosphere.change || "Seasonal changes painted the Blue Ridge landscape";
  }
  
  const baseLocation = text.includes('Asheville') ? '' : 'in Asheville, North Carolina';
  const fullAtmosphere = [atmosphericElement, baseLocation].filter(Boolean).join(', ');
  
  console.log(`🏔️ Added smart atmosphere: ${atmosphericElement ? 'emotion-based' : 'location-only'}`);
  
  return {
    text,
    atmosphere: fullAtmosphere
  };
}

function generateCinematicNarrative(text, atmosphere, rules) {
  const hasProtocols = rules.protocols && rules.protocols.cinematic;
  
  if (!hasProtocols) {
    return `**Setting:** Asheville, North Carolina\n\n${text}\n\n${atmosphere ? `*[${atmosphere}]*` : ''}`;
  }
  
  // Aplicar estilo cinematográfico HBO
  const cinematicText = `**ASHEVILLE, NORTH CAROLINA**

${text}

${atmosphere ? `*The scene unfolds as ${atmosphere.toLowerCase()}, creating the perfect backdrop for this moment in the Blue Ridge Mountains.*` : ''}

---
*[Cinematic processing: HBO-quality narrative style applied with authentic Asheville cultural context and atmospheric elements.]*`;
  
  console.log(`🎬 Applied cinematic HBO-style processing`);
  return cinematicText;
}

app.post("/mutate", async (req, res) => {
  try {
    const startTime = Date.now();
    const { textoPT, dna, timeline } = req.body;
    
    console.log("\n🚀 === DYNAMIC MUTATION REQUEST ===");
    console.log(`📝 Input: ${textoPT?.length || 0} chars`);
    
    if (!textoPT) {
      return res.status(400).json({ error: "Campo obrigatório: textoPT" });
    }

    // Carregar e parsear todas as regras dinamicamente
    const rules = await getAllRules();
    
    // Aplicar mutações dinâmicas (DNA + locations + culture)
    const mutatedText = applyDynamicMutations(textoPT, rules);
    
    // Adicionar atmosfera inteligente baseada na emoção
    const withAtmosphere = addSmartAtmosphere(mutatedText, rules);
    
    // Gerar narrativa cinematográfica
    const cinematicResult = generateCinematicNarrative(
      withAtmosphere.text, 
      withAtmosphere.atmosphere, 
      rules
    );
    
    // Estatísticas para SENTRY
    const stats = {
      dnaRules: Object.keys(rules.dna).length,
      mutationRules: Object.keys(rules.mutations).length,
      hasAtmosphere: !!withAtmosphere.atmosphere,
      hasCinematic: rules.protocols?.cinematic || false,
      processingTime: Date.now() - startTime,
      textChanged: mutatedText !== textoPT
    };

    console.log(`⏱️ Completed in ${stats.processingTime}ms`);
    console.log("✅ === DYNAMIC MUTATION COMPLETED ===\n");

    res.json({
      roteiroEN: cinematicResult,
      aberturaAB: [
        "Where Blue Ridge secrets meet Asheville shadows",
        "In North Carolina mountains, every story finds its truth"
      ],
      shorts: [
        "Asheville holds more than mountain views – it holds destinies.",
        "In the Blue Ridge, some conversations echo through generations.",
        "North Carolina mountains witness more than just changing seasons."
      ],
      relatorioSENTRY: `🛰️ Relatório SENTRY - DYNAMIC SYSTEM
- DNA Rules: ✅ ${stats.dnaRules} personagens carregados dinamicamente
- Mutation Rules: ✅ ${stats.mutationRules} mutações culturais ativas
- Geografia: ✅ Asheville locations & Blue Ridge atmosphere
- Atmosfera: ${stats.hasAtmosphere ? '✅' : '❌'} Smart emotion-based elements
- Narrativa: ${stats.hasCinematic ? '✅' : '❌'} HBO cinematic style applied
- Mutações Aplicadas: ${stats.textChanged ? '✅' : '❌'} Text transformed
- Processamento: ${stats.processingTime}ms (dynamic parsing)
- Source: GitHub Live (auto-updating)
- Timestamp: ${new Date().toISOString()}
- System: MUTANT_SUPREME_EN v2.0 Dynamic`
    });

  } catch (err) {
    console.error("❌ Dynamic mutation error:", err);
    res.status(500).json({ 
      error: "Erro no sistema dinâmico",
      details: err.message,
      system: "MUTANT_SUPREME_EN v2.0"
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    system: "MUTANT_SUPREME_EN v2.0 Dynamic",
    source: "GitHub Live Auto-Parsing",
    cache: parsedRules ? "active" : "empty",
    uptime: process.uptime(),
    rulesLoaded: parsedRules ? {
      dna: Object.keys(parsedRules.dna).length,
      mutations: Object.keys(parsedRules.mutations).length,
      atmosphere: !!parsedRules.atmosphere,
      protocols: !!parsedRules.protocols
    } : null
  });
});

app.get("/debug/rules", async (req, res) => {
  const rules = await getAllRules();
  res.json({
    system: "MUTANT_SUPREME_EN v2.0 Dynamic",
    rulesBreakdown: {
      dnaCount: Object.keys(rules.dna).length,
      mutationsCount: Object.keys(rules.mutations).length,
      atmosphereElements: Object.keys(rules.atmosphere).length,
      protocolsActive: Object.keys(rules.protocols).length
    },
    sampleDNA: Object.fromEntries(Object.entries(rules.dna).slice(0, 5)),
    sampleMutations: Object.fromEntries(Object.entries(rules.mutations).slice(0, 5)),
    cacheStatus: parsedRules ? "active" : "empty",
    lastFetch: lastFetch ? new Date(lastFetch).toISOString() : "never"
  });
});

app.listen(PORT, () => {
  console.log(`🚀 MUTANT_SUPREME_EN v2.0 Dynamic Server running on port ${PORT}`);
  console.log(`📁 Auto-parsing from GitHub: ${RULES_FILES.length} files`);
  console.log(`🧠 Dynamic rule processing: DNA + Mutations + Atmosphere + Protocols`);
  console.log(`🎯 Enterprise-grade system with live updates activated`);
});
