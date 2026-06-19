export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    // Both 'components' and 'substances' are accepted.
    const components = req.body.components || req.body.substances || [];

    if (!Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ error: 'Invalid request body. Provide an array of components with name and percentage.' });
    }

    let total = 0;
    const parsed = [];

    for (const item of components) {
      const name = typeof item.name === 'string' ? item.name.trim() : typeof item.Common_Name_PT === 'string' ? item.Common_Name_PT.trim() : '';
      const percentage = parseFloat(item.percentage || item.fraction);

      if (!name) {
        return res.status(400).json({ error: 'All components must have a non-empty name.' });
      }
      if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
        return res.status(400).json({ error: `Invalid percentage for component "${name}". Must be a number between 0 and 100.` });
      }
      total += percentage;
      parsed.push({ name, percentage });
    }

    const analysis = analyzeMixture(parsed);
    const result = classifyMixture(analysis);

    const detailedResult = {
      ...result,
      details: {
        components: parsed,
        total_percentage: total,
        fractions: analysis.fractions,
        present_classes: analysis.present,
        dominant_class: analysis.dominant,
        dominant_percentage: analysis.dominantPct,
        incompatibilities: analysis.incompatibilities,
        h_phrases_texts: result.h_phrases.map(code => ({ code, text: H_PHRASES[code] || '' })),
        p_phrases_texts: result.p_phrases.map(code => ({ code, text: P_PHRASES[code] || '' }))
      }
    };

    return res.status(200).json(detailedResult);

  } catch (error) {
    console.error('Error in /api/classify:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

const KEYWORDS = {
  acid_inorganic: ["sulfurico", "sulfúrico", "nitrico", "nítrico", "cloridrico", "clorídrico", "fosforico", "fosfórico", "fluoridrico", "fluorídrico"],
  acid_organic: ["acetico", "acético", "formico", "fórmico", "citrico", "cítrico"],
  base: ["hidroxido", "hidróxido", "soda", "potassa", "amonia", "amônia", "amina"],
  flammable: ["alcool", "álcool", "etanol", "metanol", "isopropanol", "acetona", "hexano", "tolueno", "xileno", "solvente", "eter", "éter", "acetato"],
  oxidizer: ["peroxido", "peróxido", "clorato", "nitrato", "permanganato", "dicromato", "persulfato"],
  cyanide: ["cianeto", "cyanide"],
  sulfide: ["sulfeto", "sulfide"],
  hypochlorite: ["hipoclorito", "agua sanitaria", "água sanitária", "cloro"],
  toxic_acute: ["cloroformio", "clorofórmio", "diclorometano", "fenol", "formol", "formaldeido", "formaldeído", "anilina", "mercurio", "mercúrio", "metanol"],
  reactive_metal: ["aluminio em po", "alumínio em pó", "zinco em po", "zinco em pó", "sodio metalico", "sódio metálico"]
};

const INCOMPATIBILITY_MATRIX = [
  { "a": "acid_inorganic", "b": "hypochlorite", "gas": "Cl2", "desc": "[CRITICAL] Ácidos + Hipocloritos → Liberação de gás cloro (Cl2) tóxico, asfixiante e corrosivo. Evite a mistura; use EPI completo e ventilação." },
  { "a": "acid_organic", "b": "hypochlorite", "gas": "Cl2", "desc": "[CRITICAL] Ácidos + Hipocloritos → Liberação de gás cloro (Cl2) tóxico, asfixiante e corrosivo." },
  { "a": "base", "b": "hypochlorite", "gas": "NH2Cl", "desc": "[CRITICAL] Amônia/Aminas (Bases) + Hipocloritos → Liberação de Cloraminas (NH2Cl), gases altamente tóxicos e irritantes para as vias respiratórias." },
  { "a": "acid_inorganic", "b": "cyanide", "gas": "HCN", "desc": "[FATAL] Ácidos + Cianetos → Liberação de Gás Cianídrico (HCN), extremamente tóxico e letal. Risco de morte imediata por inalação." },
  { "a": "acid_organic", "b": "cyanide", "gas": "HCN", "desc": "[FATAL] Ácidos + Cianetos → Liberação de Gás Cianídrico (HCN), letal por inalação." },
  { "a": "acid_inorganic", "b": "sulfide", "gas": "H2S", "desc": "[FATAL] Ácidos + Sulfetos → Liberação de Gás Sulfídrico (H2S), altamente tóxico, asfixiante e inflamável." },
  { "a": "acid_organic", "b": "sulfide", "gas": "H2S", "desc": "[FATAL] Ácidos + Sulfetos → Liberação de Gás Sulfídrico (H2S)." },
  { "a": "oxidizer", "b": "flammable", "gas": null, "desc": "[CRITICAL] Oxidante + Inflamável → Risco extremo de incêndio e explosão. Reação violenta e espontânea." },
  { "a": "oxidizer", "b": "acid_organic", "gas": null, "desc": "[CRITICAL] Oxidantes + Ácidos Orgânicos → Reação violenta com risco de ignição espontânea, fervura e explosão." },
  { "a": "acid_inorganic", "b": "flammable", "gas": "NOx", "desc": "[CRITICAL] Ácidos Inorgânicos Fortes (ex: Nítrico) + Solventes Inflamáveis → Reação extremamente violenta, risco de explosão e liberação de gases nitrosos (NOx) letais." },
  { "a": "acid_inorganic", "b": "base", "gas": null, "desc": "[WARNING] Ácido + Base → Reação de neutralização fortemente exotérmica. Risco de fervura, projeção de material corrosivo e ruptura do frasco." },
  { "a": "acid_organic", "b": "base", "gas": null, "desc": "[WARNING] Ácido + Base → Reação de neutralização exotérmica. Risco de aquecimento e respingos." },
  { "a": "base", "b": "reactive_metal", "gas": "H2", "desc": "[CRITICAL] Base Forte + Metal Reativo (Alumínio/Zinco) → Liberação de gás hidrogênio (H2), altamente inflamável e explosivo." },
  { "a": "acid_inorganic", "b": "reactive_metal", "gas": "H2", "desc": "[CRITICAL] Ácido Forte + Metal Reativo → Liberação rápida de gás hidrogênio (H2), altamente inflamável e explosivo." }
];

const CLASSIFICATION_RULES = [
  {
    conditions: ["flammable", "toxic_acute", "acid_inorganic"],
    un_number: "UN3286",
    proper_shipping_name: "LÍQUIDO INFLAMÁVEL, TÓXICO, CORROSIVO, N.E.",
    risk_class: "3 (6.1, 8)",
    pictograms: ["GHS02", "GHS06", "GHS05"],
    h_phrases: ["H225", "H301", "H311", "H331", "H314"]
  },
  {
    conditions: ["flammable", "toxic_acute", "acid_organic"],
    un_number: "UN3286",
    proper_shipping_name: "LÍQUIDO INFLAMÁVEL, TÓXICO, CORROSIVO, N.E.",
    risk_class: "3 (6.1, 8)",
    pictograms: ["GHS02", "GHS06", "GHS05"],
    h_phrases: ["H225", "H301", "H311", "H331", "H314"]
  },
  {
    conditions: ["flammable", "toxic_acute", "base"],
    un_number: "UN3286",
    proper_shipping_name: "LÍQUIDO INFLAMÁVEL, TÓXICO, CORROSIVO, N.E.",
    risk_class: "3 (6.1, 8)",
    pictograms: ["GHS02", "GHS06", "GHS05"],
    h_phrases: ["H225", "H301", "H311", "H331", "H314"]
  },
  {
    conditions: ["flammable", "toxic_acute"],
    un_number: "UN1992",
    proper_shipping_name: "LÍQUIDO INFLAMÁVEL, TÓXICO, N.E.",
    risk_class: "3 (6.1)",
    pictograms: ["GHS02", "GHS06"],
    h_phrases: ["H225", "H301", "H311", "H331"]
  },
  {
    conditions: ["flammable", "acid_inorganic"],
    un_number: "UN2924",
    proper_shipping_name: "LÍQUIDO INFLAMÁVEL, CORROSIVO, N.E.",
    risk_class: "3 (8)",
    pictograms: ["GHS02", "GHS05"],
    h_phrases: ["H225", "H314"]
  },
  {
    conditions: ["flammable", "acid_organic"],
    un_number: "UN2924",
    proper_shipping_name: "LÍQUIDO INFLAMÁVEL, CORROSIVO, N.E.",
    risk_class: "3 (8)",
    pictograms: ["GHS02", "GHS05"],
    h_phrases: ["H225", "H314"]
  },
  {
    conditions: ["flammable", "base"],
    un_number: "UN2924",
    proper_shipping_name: "LÍQUIDO INFLAMÁVEL, CORROSIVO, N.E.",
    risk_class: "3 (8)",
    pictograms: ["GHS02", "GHS05"],
    h_phrases: ["H225", "H314"]
  },
  {
    conditions: ["toxic_acute", "acid_inorganic"],
    un_number: "UN2922",
    proper_shipping_name: "LÍQUIDO CORROSIVO, TÓXICO, N.E.",
    risk_class: "8 (6.1)",
    pictograms: ["GHS05", "GHS06"],
    h_phrases: ["H314", "H301", "H311", "H331"]
  },
  {
    conditions: ["toxic_acute", "acid_organic"],
    un_number: "UN2922",
    proper_shipping_name: "LÍQUIDO CORROSIVO, TÓXICO, N.E.",
    risk_class: "8 (6.1)",
    pictograms: ["GHS05", "GHS06"],
    h_phrases: ["H314", "H301", "H311", "H331"]
  },
  {
    conditions: ["toxic_acute", "base"],
    un_number: "UN2922",
    proper_shipping_name: "LÍQUIDO CORROSIVO, TÓXICO, N.E.",
    risk_class: "8 (6.1)",
    pictograms: ["GHS05", "GHS06"],
    h_phrases: ["H314", "H301", "H311", "H331"]
  },
  {
    conditions: ["flammable"],
    un_number: "UN1993",
    proper_shipping_name: "LÍQUIDO INFLAMÁVEL, N.E.",
    risk_class: "3",
    pictograms: ["GHS02", "GHS07"],
    h_phrases: ["H225", "H319", "H336"]
  },
  {
    conditions: ["toxic_acute"],
    un_number: "UN2810",
    proper_shipping_name: "LÍQUIDO TÓXICO, ORGÂNICO, N.E.",
    risk_class: "6.1",
    pictograms: ["GHS06", "GHS08"],
    h_phrases: ["H301", "H311", "H331", "H370"]
  },
  {
    conditions: ["acid_inorganic"],
    un_number: "UN3264",
    proper_shipping_name: "LÍQUIDO CORROSIVO, ÁCIDO, INORGÂNICO, N.E.",
    risk_class: "8",
    pictograms: ["GHS05", "GHS07"],
    h_phrases: ["H290", "H314", "H335"]
  },
  {
    conditions: ["acid_organic"],
    un_number: "UN3265",
    proper_shipping_name: "LÍQUIDO CORROSIVO, ÁCIDO, ORGÂNICO, N.E.",
    risk_class: "8",
    pictograms: ["GHS05", "GHS07"],
    h_phrases: ["H290", "H314", "H335"]
  },
  {
    conditions: ["base"],
    un_number: "UN3266",
    proper_shipping_name: "LÍQUIDO CORROSIVO, BÁSICO, INORGÂNICO, N.E.",
    risk_class: "8",
    pictograms: ["GHS05", "GHS07"],
    h_phrases: ["H290", "H314"]
  },
  {
    conditions: ["oxidizer"],
    un_number: "UN3139",
    proper_shipping_name: "LÍQUIDO OXIDANTE, N.E.",
    risk_class: "5.1",
    pictograms: ["GHS03", "GHS07"],
    h_phrases: ["H272", "H315", "H319"]
  }
];

const H_PHRASES = {
  "H225": "Líquido e vapores altamente inflamáveis.",
  "H226": "Líquido e vapores inflamáveis.",
  "H272": "Pode agravar incêndios; comburente.",
  "H290": "Pode ser corrosivo para os metais.",
  "H301": "Tóxico se ingerido.",
  "H311": "Tóxico em contato com a pele.",
  "H314": "Provoca queimaduras na pele e lesões oculares graves.",
  "H315": "Provoca irritação cutânea.",
  "H319": "Provoca irritação ocular grave.",
  "H331": "Tóxico se inalado.",
  "H335": "Pode provocar irritação das vias respiratórias.",
  "H336": "Pode provocar sonolência ou vertigens.",
  "H370": "Provoca danos aos órgãos."
};

const P_PHRASES = {
  "P210": "Manter afastado do calor, faíscas, chamas abertas e superfícies quentes. Não fumar.",
  "P233": "Manter o recipiente bem fechado.",
  "P235": "Conservar em ambiente fresco.",
  "P260": "Não respirar as poeiras/fumos/gases/névoas/vapores/aerossóis.",
  "P264": "Lavar as mãos cuidadosamente após manuseamento.",
  "P271": "Utilizar apenas ao ar livre ou em locais bem ventilados.",
  "P280": "Usar luvas de proteção/vestuário de proteção/proteção ocular/proteção facial.",
  "P301+P310": "EM CASO DE INGESTÃO: Contacte imediatamente um CENTRO DE INFORMAÇÃO ANTIVENENOS ou um médico.",
  "P303+P361+P353": "SE ENTRAR EM CONTACTO COM A PELE (ou o cabelo): despir/retirar imediatamente toda a roupa contaminada. Enxaguar a pele com água/tomar um duche.",
  "P304+P340": "EM CASO DE INALAÇÃO: retirar a vítima para uma zona ao ar livre e mantê-la em repouso numa posição que não dificulte a respiração.",
  "P305+P351+P338": "SE ENTRAR EM CONTACTO COM OS OLHOS: enxaguar cuidadosamente com água durante vários minutos. Se usar lentes de contacto, retire-as, se tal lhe for possível. Continuar a enxaguar.",
  "P310": "Contacte imediatamente um CENTRO DE INFORMAÇÃO ANTIVENENOS ou um médico.",
  "P403+P235": "Armazenar em local bem ventilado. Conservar em ambiente fresco.",
  "P405": "Armazenar em local fechado à chave.",
  "P501": "Eliminar o conteúdo/recipiente de acordo com a legislação local/regional/nacional/internacional."
};

function normalize(str) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchesKeywords(name, keywords) {
  const normalized = normalize(name);
  return keywords.some((kw) => normalized.includes(normalize(kw)));
}

function detectClasses(components) {
  const fractions = {};
  for (const key of Object.keys(KEYWORDS)) {
    fractions[key] = 0;
  }

  for (const comp of components) {
    const name = comp.name;
    const pct = comp.percentage;

    for (const [key, keywords] of Object.entries(KEYWORDS)) {
      if (matchesKeywords(name, keywords)) {
        fractions[key] += pct;
      }
    }
  }

  return fractions;
}

function analyzeMixture(components) {
  const fractions = detectClasses(components);

  const present = Object.keys(fractions).filter(k => fractions[k] > 0);

  const incompatibilities = [];
  for (const rule of INCOMPATIBILITY_MATRIX) {
    if (present.includes(rule.a) && present.includes(rule.b)) {
      incompatibilities.push({ pair: [rule.a, rule.b], gas: rule.gas, description: rule.desc, severity: rule.desc.match(/\[(.*?)\]/) ? rule.desc.match(/\[(.*?)\]/)[1] : 'WARNING' });
    }
  }

  const sorted = Object.entries(fractions).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0] ? sorted[0][0] : null;
  const dominantPct = sorted[0] ? sorted[0][1] : 0;

  return { fractions, present, incompatibilities, dominant, dominantPct };
}

function classifyMixture(analysis) {
  const { present, incompatibilities } = analysis;

  let matchedRule = null;
  
  // Sort rules by number of conditions descending to match most specific first
  const sortedRules = [...CLASSIFICATION_RULES].sort((a, b) => b.conditions.length - a.conditions.length);

  for (const rule of sortedRules) {
    if (rule.conditions.every(c => present.includes(c))) {
      matchedRule = rule;
      break;
    }
  }

  const defaultPPhrases = ['P210', 'P233', 'P260', 'P264', 'P280', 'P303+P361+P353', 'P305+P351+P338', 'P403+P235', 'P501'];

  if (!matchedRule) {
    if (present.length > 0) {
      return {
        un_number: 'UN0000',
        proper_shipping_name: 'MISTURA PERIGOSA, N.E.',
        risk_class: 'Variada',
        risk_number: '',
        pictograms: ['GHS07'],
        h_phrases: ['H315', 'H319'],
        p_phrases: defaultPPhrases,
        safety_alert: 'Mistura complexa não listada. Consulte um especialista.',
        incompatibilities
      };
    } else {
      return {
        un_number: 'UN0000',
        proper_shipping_name: 'NÃO CLASSIFICADO COMO PERIGOSO',
        risk_class: '',
        risk_number: '',
        pictograms: [],
        h_phrases: [],
        p_phrases: [],
        safety_alert: 'Mistura não apresenta riscos primários nas categorias avaliadas.',
        incompatibilities
      };
    }
  }

  let safety_alert = '';
  if (incompatibilities.length > 0) {
    safety_alert = incompatibilities.map(i => i.description).join(' ');
  } else {
    safety_alert = 'Mistura classificada com sucesso. Siga as instruções de armazenamento e descarte adequadas.';
  }

  return {
    un_number: matchedRule.un_number,
    proper_shipping_name: matchedRule.proper_shipping_name,
    risk_class: matchedRule.risk_class,
    risk_number: '',
    pictograms: matchedRule.pictograms,
    h_phrases: matchedRule.h_phrases,
    p_phrases: defaultPPhrases,
    safety_alert: safety_alert,
    incompatibilities
  };
}