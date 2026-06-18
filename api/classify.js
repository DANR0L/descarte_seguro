export default function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  try {
    const { components } = req.body || {};

    if (!Array.isArray(components) || components.length === 0) {
      return res.status(400).json({ error: 'Invalid request body. Provide an array of components with name and percentage.' });
    }

    let total = 0;
    const parsed = [];

    for (const item of components) {
      const name = typeof item.name === 'string' ? item.name.trim() : '';
      const percentage = parseFloat(item.percentage);

      if (!name) {
        return res.status(400).json({ error: 'All components must have a non-empty name.' });
      }
      if (Number.isNaN(percentage) || percentage < 0 || percentage > 100) {
        return res.status(400).json({ error: `Invalid percentage for component "${name}". Must be a number between 0 and 100.` });
      }
      total += percentage;
      parsed.push({ name, percentage });
    }

    const roundedTotal = Math.round(total * 100) / 100;
    if (roundedTotal !== 100) {
      return res.status(400).json({ error: `Component percentages must sum to 100. Current sum: ${roundedTotal}.` });
    }

    const analysis = analyzeMixture(parsed);
    const classification = classifyMixture(analysis);

    return res.status(200).json({
      un_number: classification.un_number,
      proper_shipping_name: classification.proper_shipping_name,
      risk_class: classification.risk_class,
      risk_number: classification.risk_number,
      pictograms: classification.pictograms,
      h_phrases: classification.h_phrases,
      p_phrases: classification.p_phrases,
      safety_alert: classification.safety_alert,
      incompatibilities: classification.incompatibilities,
    });
  } catch (err) {
    console.error('classify API error:', err);
    return res.status(500).json({ error: 'Internal server error during classification.' });
  }
}

const KEYWORDS = {
  acid: [
    'acid', 'ácido', 'acido', 'acetic', 'acético', 'acetico', 'sulfuric', 'sulfúrico', 'sulfurico',
    'hydrochloric', 'clorídrico', 'cloridrico', 'muriatic', 'muriático', 'muriatico', 'nitric', 'nítrico', 'nitrico',
    'phosphoric', 'fosfórico', 'fosforico', 'citric', 'cítrico', 'citrico', 'formic', 'fórmico', 'formico',
    'oxalic', 'oxálico', 'oxalico', 'lactic', 'láctico', 'lactico', 'tartaric', 'tártarico', 'tartarico',
    'peracetic', 'peracético', 'peracetico', 'chloroacetic', 'cloroacético', 'cloroacetico',
    'fluorhydric', 'fluorhídrico', 'fluorhidrico', 'hydrofluoric', 'fluorídrico', 'fluoridrico',
    'bromic', 'brómico', 'bromico', 'iodic', 'iódico', 'iodico', 'chromic', 'crómico', 'cromico',
    'sulfamic', 'sulfâmico', 'sulfamico', 'toluenesulfonic', 'toluenosulfônico', 'toluenosulfonico',
    'boric', 'bórico', 'borico', 'carbonic', 'carbónico', 'carbonico', 'hypochlorous', 'hipocloroso', 'perchloric', 'perclórico', 'perclorico',
  ],
  base: [
    'base', 'bas', 'sodium hydroxide', 'potassium hydroxide', 'ammonia', 'amônia', 'amoniacal', 'ammoniacal',
    'ammonium hydroxide', 'hidróxido de amônio', 'hidroxido de amonio', 'hidróxido de amónio',
    'calcium hydroxide', 'magnesium hydroxide', 'lithium hydroxide', 'barium hydroxide', 'strontium hydroxide',
    'hidróxido de sódio', 'hidroxido de sodio', 'hidróxido de sódio', 'hidróxido de potássio', 'hidroxido de potasio',
    'hidróxido de cálcio', 'hidroxido de calcio', 'hidróxido de magnésio', 'hidroxido de magnesio',
    'hidróxido de lítio', 'hidroxido de litio', 'hidróxido de bário', 'hidroxido de bario',
    'soda cáustica', 'soda caustica', 'potassa cáustica', 'potassa caustica', 'cal viva', 'cal apagada',
    'lime', 'slaked lime', 'quicklime', 'caustic', 'cáustico', 'caustico', 'alkali', 'alkaline', 'alcalino', 'alcalina',
    'potash', 'soda ash', 'sodium carbonate', 'potassium carbonate', 'washing soda', 'bicarbonate',
  ],
  flammable: [
    'alcohol', 'álcool', 'alcool', 'ethanol', 'etanol', 'methanol', 'metanol', 'propanol', 'isopropanol', 'isopropyl alcohol',
    'álcool etílico', 'alcool etilico', 'álcool metílico', 'alcool metilico', 'álcool isopropílico', 'alcool isopropilico',
    'gasoline', 'gasolina', 'petrol', 'diesel', 'kerosene', 'querosene', 'naphtha', 'nafta', 'acetone', 'acetona',
    'ether', 'éter', 'eter', 'benzene', 'benzeno', 'toluene', 'tolueno', 'xylene', 'xileno', 'hexane', 'heptane',
    'pentane', 'cyclohexane', 'cyclohexanone', 'methyl ethyl ketone', 'mek', 'butanone', 'ethyl acetate', 'acetato de etila',
    'methyl acetate', 'acetato de metila', 'isopropyl acetate', 'acetato de isopropila', 'butyl acetate', 'acetato de butila',
    'formaldehyde', 'formol', 'formaldeído', 'acetaldehyde', 'acetaldeído', 'propionaldehyde', 'butyraldehyde',
    'thinner', 'reducer', 'diluent', 'diluente', 'solvent', 'solvente', 'paint thinner', 'tinner', 'tinta', 'paint',
    'shellac', 'goma laca', 'resin', 'resina', 'turpentine', 'trementina', 'mineral spirits', 'white spirit',
    'stoddard solvent', 'hydrocarbon', 'hidrocarboneto', 'hydrocarbon', 'fuel', 'combustível', 'combustible',
    'propane', 'propano', 'butane', 'butano', 'lpg', 'gpl', 'natural gas', 'gás natural', 'gas natural',
    'ethylene', 'etileno', 'propylene', 'propileno', 'acetylene', 'acetileno', 'vinyl', 'vynil', 'monomer', 'monómero',
    'peroxide', 'peróxido', 'peroxido', 'organic peroxide', 'peróxido orgânico', 'peroxido organico',
  ],
  oxidizer: [
    'oxidizer', 'oxidante', 'oxidiser', 'oxidizing', 'peroxide', 'peróxido', 'peroxido', 'hydrogen peroxide', 'peróxido de hidrogênio',
    'peróxido de hidrogénio', 'peroxido de hidrogeno', 'agua oxigenada', 'água oxigenada', 'peróxido de sódio', 'peroxido de sodio',
    'peroxide de barium', 'peróxido de bário', 'peroxido de bario', 'peroxide de magnésio', 'peróxido de magnésio', 'peroxido de magnesio',
    'sodium hypochlorite', 'hipoclorito de sódio', 'hipoclorito de sodio', 'hypochlorite', 'hipoclorito', 'bleach', 'água sanitária', 'cloro',
    'chlorine', 'cloro', 'sodium chlorate', 'potassium chlorate', 'chlorate', 'clorato', 'perchlorate', 'perclorato', 'perchloric acid',
    'nitrato', 'nitrate', 'sodium nitrate', 'potassium nitrate', 'ammonium nitrate', 'nitrato de amônio', 'nitrato de amonio', 'nitrato de amónio',
    'permanganate', 'permanganato', 'potassium permanganate', 'permanganato de potássio', 'permanganato de potasio', 'permanganato de potássio',
    'dichromate', 'dicromato', 'potassium dichromate', 'dicromato de potássio', 'dicromato de potasio', 'sodium dichromate', 'dicromato de sódio',
    'chromate', 'cromato', 'persulfate', 'persulfato', 'peroxidisulfate', 'peróxido de enxofre', 'peroxodisulfate',
    'ozone', 'ozônio', 'ozono', 'fluorine', 'flúor', 'fluor', 'bromine', 'bromo', 'nitric acid', 'nitrogen tetroxide',
    'perclórico', 'perclorico', 'clorato', 'nitrato', 'permanganato', 'dicromato', 'cromato', 'persulfato',
  ],
  toxic: [
    'toxic', 'tóxico', 'toxico', 'poison', 'veneno', 'cyanide', 'cianeto', 'cyanato', 'cianato', 'hydrocyanic acid', 'ácido cianídrico',
    'acido cianhidrico', 'ácido cianhídrico', 'sodium cyanide', 'cianeto de sódio', 'cianeto de sodio', 'potassium cyanide', 'cianeto de potássio',
    'cianeto de potasio', 'arsenic', 'arsênio', 'arsenico', 'mercury', 'mercúrio', 'mercurio', 'lead', 'chumbo', 'plomo', 'cadmium', 'cádmio',
    'cadmio', 'chromium', 'cromo', 'hexavalent', 'hexavalente', 'nickel', 'níquel', 'niquel', 'beryllium', 'berílio', 'berilio',
    'thallium', 'tálio', 'talio', 'selenium', 'selênio', 'selenio', 'antimony', 'antimônio', 'antimonio', 'phenol', 'fenol',
    'formaldehyde', 'formaldeído', 'formol', 'methanol', 'metanol', 'carbon tetrachloride', 'tetracloreto de carbono',
    'tetrachloromethane', 'tetraclorometano', 'chloroform', 'clorofórmio', 'cloroformio', 'trichloroethylene', 'tricloroetileno',
    'tetrachloroethylene', 'tetracloroetileno', 'pesticide', 'pesticida', 'herbicide', 'herbicida', 'insecticide', 'inseticida',
    'fungicide', 'fungicida', 'rodenticide', 'rodenticida', 'fumigant', 'fumigante', 'nematicide', 'carbamate', 'carbamato', 'organophosphate',
    'organofosforado', 'organofosforo', 'phosgene', 'fosgênio', 'fosgenio', 'mustard gas', 'gás mostarda', 'gas mostaza',
    'hydrogen sulfide', 'sulfeto de hidrogênio', 'sulfeto de hidrogénio', 'sulfuro de hidrogeno', 'ammonia', 'amônia', 'amoniaco',
    'chlorine', 'cloro', 'phosphine', 'fosfina', 'arsine', 'arsina', 'sibine', 'stibine', 'hydrogen selenide', 'seleneto de hidrogênio',
    'nitrobenzene', 'nitrobenzeno', 'aniline', 'anilina', 'benzidine', 'benzidina', 'hydrazine', 'hidrazina', 'methylamine', 'metilamina',
    'ethylene glycol', 'etilenoglicol', 'antifreeze', 'anticongelante', 'coolant', 'refrigerante', 'ethylene oxide', 'óxido de etileno',
    'oxido de etileno', 'acrylonitrile', 'acrilonitrila', 'acetonitrile', 'acetonitrila', 'benzene', 'benzeno', 'asbestos', 'amianto',
    'silica', 'silica', 'quartz', 'quartzo', 'respirable', 'respirável', 'carcinogenic', 'carcinogênico', 'carcinogenico', 'mutagenic', 'mutagênico',
  ],
};

const INCOMPATIBILITY_MATRIX = [
  { a: 'acid', b: 'hypochlorite', gas: 'Cl2', desc: 'Ácido + hipoclorito libera gás cloro (Cl2) tóxico.' },
  { a: 'acid', b: 'cyanide', gas: 'HCN', desc: 'Ácido + cianeto libera ácido cianídrico (HCN) letal.' },
  { a: 'acid', b: 'base', gas: null, desc: 'Ácido + base reage exotermicamente (neutralização violenta).' },
  { a: 'acid', b: 'flammable', gas: null, desc: 'Ácido + inflamável pode gerar calor e vapores inflamáveis.' },
  { a: 'oxidizer', b: 'flammable', gas: null, desc: 'Oxidante + inflamável pode causar incêndio ou explosão.' },
  { a: 'oxidizer', b: 'organic', gas: null, desc: 'Oxidante forte + materiais orgânicos pode gerar explosão.' },
  { a: 'oxidizer', b: 'acid', gas: null, desc: 'Oxidante + ácido pode liberar gases tóxicos e intensificar reação.' },
  { a: 'base', b: 'flammable', gas: null, desc: 'Base + inflamável pode acelerar decomposição ou reação exotérmica.' },
  { a: 'acid', b: 'sulfide', gas: 'H2S', desc: 'Ácido + sulfeto libera gás sulfídrico (H2S) tóxico.' },
  { a: 'acid', b: 'nitrite', gas: 'NOx', desc: 'Ácido + nitrito libera óxidos de nitrogênio (NOx) tóxicos.' },
  { a: 'acid', b: 'carbide', gas: 'C2H2', desc: 'Ácido + carbeto libera acetileno (C2H2) inflamável.' },
  { a: 'water', b: 'alkali metal', gas: 'H2', desc: 'Água + metal alcalino libera hidrogênio (H2) inflamável.' },
  { a: 'ammonia', b: 'chlorine', gas: null, desc: 'Amônia + cloro forma cloraminas tóxicas.' },
  { a: 'ammonia', b: 'hypochlorite', gas: null, desc: 'Amônia + hipoclorito forma cloraminas tóxicas e explosivas.' },
  { a: 'acid', b: 'chlorate', gas: 'ClO2/Cl2', desc: 'Ácido + clorato pode liberar dióxido de cloro e cloro.' },
  { a: 'acid', b: 'perchlorate', gas: 'ClO2', desc: 'Ácido + perclorato pode liberar dióxido de cloro explosivo.' },
  { a: 'nitric acid', b: 'organic', gas: null, desc: 'Ácido nítrico + matéria orgânica pode causar explosão.' },
  { a: 'nitric acid', b: 'flammable', gas: null, desc: 'Ácido nítrico + inflamável pode causar incêndio/explosão.' },
  { a: 'sulfuric acid', b: 'water', gas: null, desc: 'Ácido sulfúrico concentrado + água libera calor intenso.' },
  { a: 'oxidizer', b: 'reducer', gas: null, desc: 'Oxidante + redutor reage de forma violenta.' },
];

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
  const fractions = { acid: 0, base: 0, flammable: 0, oxidizer: 0, toxic: 0 };

  for (const comp of components) {
    const name = comp.name;
    const pct = comp.percentage;

    const isAlcohol = matchesKeywords(name, ['alcohol', 'alcool', 'ethanol', 'etanol', 'methanol', 'metanol', 'propanol', 'isopropanol', 'isopropyl alcohol']);
    const isEthanol = matchesKeywords(name, ['ethanol', 'etanol', 'ethyl alcohol', 'alcohol', 'alcool etilico', 'alcool etilico', 'alcohol etilico', 'alcool etilico']);

    if (isEthanol || isAlcohol) {
      fractions.flammable += pct;
      continue;
    }

    if (matchesKeywords(name, KEYWORDS.acid)) fractions.acid += pct;
    if (matchesKeywords(name, KEYWORDS.base)) fractions.base += pct;
    if (matchesKeywords(name, KEYWORDS.flammable)) fractions.flammable += pct;
    if (matchesKeywords(name, KEYWORDS.oxidizer)) fractions.oxidizer += pct;
    if (matchesKeywords(name, KEYWORDS.toxic)) fractions.toxic += pct;
  }

  return fractions;
}

function analyzeMixture(components) {
  const fractions = detectClasses(components);

  const present = [];
  if (fractions.acid > 0) present.push('acid');
  if (fractions.base > 0) present.push('base');
  if (fractions.flammable > 0) present.push('flammable');
  if (fractions.oxidizer > 0) present.push('oxidizer');
  if (fractions.toxic > 0) present.push('toxic');

  const incompatibilities = [];
  for (const rule of INCOMPATIBILITY_MATRIX) {
    if (present.includes(rule.a) && present.includes(rule.b)) {
      incompatibilities.push({ pair: [rule.a, rule.b], gas: rule.gas, description: rule.desc });
    } else if (present.includes(rule.b) && present.includes(rule.a)) {
      incompatibilities.push({ pair: [rule.b, rule.a], gas: rule.gas, description: rule.desc });
    }
  }

  const sorted = Object.entries(fractions).sort((a, b) => b[1] - a[1]);
  const dominant = sorted[0][0];
  const dominantPct = sorted[0][1];

  return { fractions, present, incompatibilities, dominant, dominantPct };
}

function buildClassifyResult(opts) {
  return {
    un_number: opts.un_number,
    proper_shipping_name: opts.proper_shipping_name,
    risk_class: opts.risk_class,
    risk_number: opts.risk_number,
    pictograms: Array.from(new Set(opts.pictograms)).filter(Boolean),
    h_phrases: Array.from(new Set(opts.h_phrases)).filter(Boolean),
    p_phrases: Array.from(new Set(opts.p_phrases)).filter(Boolean),
    safety_alert: opts.safety_alert,
    incompatibilities: opts.incompatibilities,
  };
}

function classifyMixture(analysis) {
  const { fractions, present, incompatibilities, dominant, dominantPct } = analysis;

  const commonP = [
    'P210: Keep away from heat, sparks, open flames and hot surfaces. No smoking.',
    'P233: Keep container tightly closed.',
    'P235: Keep cool.',
    'P260: Do not breathe dust/fume/gas/mist/vapours/spray.',
    'P264: Wash hands thoroughly after handling.',
    'P271: Use only outdoors or in a well-ventilated area.',
    'P280: Wear protective gloves/protective clothing/eye protection/face protection.',
    'P301+P312: IF SWALLOWED: Call a POISON CENTER or doctor/physician if you feel unwell.',
    'P303+P361+P353: IF ON SKIN (or hair): Remove/Take off immediately all contaminated clothing. Rinse skin with water/shower.',
    'P304+P340: IF INHALED: Remove victim to fresh air and keep at rest in a position comfortable for breathing.',
    'P305+P351+P338: IF IN EYES: Rinse cautiously with water for several minutes. Remove contact lenses if present and easy to do. Continue rinsing.',
    'P310: Immediately call a POISON CENTER or doctor/physician.',
    'P312: Call a POISON CENTER or doctor/physician if you feel unwell.',
    'P330: Rinse mouth.',
    'P403+P235: Store in a well-ventilated place. Keep cool.',
    'P405: Store locked up.',
    'P501: Dispose of contents/container in accordance with local/regional/national/international regulations.',
  ];

  if (dominant === 'flammable') {
    return buildClassifyResult({
      un_number: 'UN1170',
      proper_shipping_name: 'ETHANOL SOLUTION or ALCOHOL SOLUTION (flammable liquid)',
      risk_class: '3',
      risk_number: '33',
      pictograms: ['GHS02', 'GHS07'],
      h_phrases: [
        'H225: Highly flammable liquid and vapour.',
        'H319: Causes serious eye irritation.',
        'H336: May cause drowsiness or dizziness.',
      ],
      p_phrases: commonP,
      safety_alert: 'Classificado exclusivamente como líquido inflamável (Classe 3). Não aplicável como tóxico Classe 6.1. Evitar fontes de ignição.',
      incompatibilities,
    });
  }

  if (fractions.acid > 0 && fractions.base > 0) {
    return buildClassifyResult({
      un_number: 'UN3264',
      proper_shipping_name: 'CORROSIVE LIQUID, ACIDIC, INORGANIC, N.O.S. or CORROSIVE LIQUID, BASIC, INORGANIC, N.O.S.',
      risk_class: '8',
      risk_number: '80',
      pictograms: ['GHS05', 'GHS07'],
      h_phrases: [
        'H290: May be corrosive to metals.',
        'H314: Causes severe skin burns and eye damage.',
        'H315: Causes skin irritation.',
        'H319: Causes serious eye irritation.',
      ],
      p_phrases: commonP,
      safety_alert: 'Mistura ácido-base incompatível. Reação exotérmica de neutralização. Risco de respingos corrosivos.',
      incompatibilities,
    });
  }

  if (fractions.oxidizer > 0 && fractions.flammable > 0) {
    return buildClassifyResult({
      un_number: 'UN3139',
      proper_shipping_name: 'OXIDIZING LIQUID, N.O.S. with flammable component',
      risk_class: '5.1',
      risk_number: '50',
      pictograms: ['GHS03', 'GHS02', 'GHS07'],
      h_phrases: [
        'H272: May intensify fire; oxidizer.',
        'H225: Highly flammable liquid and vapour.',
        'H302: Harmful if swallowed.',
        'H319: Causes serious eye irritation.',
      ],
      p_phrases: commonP,
      safety_alert: 'Combinação oxidante + inflamável. Alto risco de incêndio e explosão. Isolar de fontes de ignição e materiais combustíveis.',
      incompatibilities,
    });
  }

  if (fractions.acid > 0 && (fractions.oxidizer > 0 || incompatibilities.some((i) => i.gas))) {
    return buildClassifyResult({
      un_number: 'UN3264',
      proper_shipping_name: 'CORROSIVE LIQUID, ACIDIC, INORGANIC, N.O.S.',
      risk_class: '8',
      risk_number: '80',
      pictograms: ['GHS05', 'GHS03', 'GHS07'],
      h_phrases: [
        'H290: May be corrosive to metals.',
        'H314: Causes severe skin burns and eye damage.',
        'H272: May intensify fire; oxidizer.',
      ],
      p_phrases: commonP,
      safety_alert: 'Ácido com oxidante ou gerador de gases tóxicos. Risco de corrosão, liberação de gases e intensificação de incêndio.',
      incompatibilities,
    });
  }

  if (fractions.acid > 0) {
    return buildClassifyResult({
      un_number: 'UN3264',
      proper_shipping_name: 'CORROSIVE LIQUID, ACIDIC, INORGANIC, N.O.S.',
      risk_class: '8',
      risk_number: '80',
      pictograms: ['GHS05', 'GHS07'],
      h_phrases: [
        'H290: May be corrosive to metals.',
        'H314: Causes severe skin burns and eye damage.',
        'H315: Causes skin irritation.',
        'H319: Causes serious eye irritation.',
      ],
      p_phrases: commonP,
      safety_alert: 'Mistura ácida. Corrosiva. Evitar contato com pele, olhos e metais. Manter afastado de bases e hipocloritos.',
      incompatibilities,
    });
  }

  if (fractions.base > 0) {
    return buildClassifyResult({
      un_number: 'UN3266',
      proper_shipping_name: 'CORROSIVE LIQUID, BASIC, INORGANIC, N.O.S.',
      risk_class: '8',
      risk_number: '80',
      pictograms: ['GHS05', 'GHS07'],
      h_phrases: [
        'H290: May be corrosive to metals.',
        'H314: Causes severe skin burns and eye damage.',
        'H315: Causes skin irritation.',
        'H319: Causes serious eye irritation.',
      ],
      p_phrases: commonP,
      safety_alert: 'Mistura básica. Corrosiva. Evitar contato com ácidos e materiais inflamáveis.',
      incompatibilities,
    });
  }

  if (fractions.oxidizer > 0) {
    return buildClassifyResult({
      un_number: 'UN3149',
      proper_shipping_name: 'OXIDIZING LIQUID, N.O.S.',
      risk_class: '5.1',
      risk_number: '50',
      pictograms: ['GHS03', 'GHS07'],
      h_phrases: [
        'H272: May intensify fire; oxidizer.',
        'H302: Harmful if swallowed.',
        'H314: Causes severe skin burns and eye damage.',
        'H319: Causes serious eye irritation.',
      ],
      p_phrases: commonP,
      safety_alert: 'Oxidante. Pode intensificar incêndios. Manter isolado de combustíveis, redutores e agentes inflamáveis.',
      incompatibilities,
    });
  }

  if (fractions.toxic > 0) {
    return buildClassifyResult({
      un_number: 'UN2810',
      proper_shipping_name: 'TOXIC LIQUID, ORGANIC, N.O.S.',
      risk_class: '6.1',
      risk_number: '60',
      pictograms: ['GHS06', 'GHS07', 'GHS08'],
      h_phrases: [
        'H300: Fatal if swallowed.',
        'H310: Fatal in contact with skin.',
        'H330: Fatal if inhaled.',
        'H315: Causes skin irritation.',
        'H319: Causes serious eye irritation.',
        'H373: May cause damage to organs through prolonged or repeated exposure.',
      ],
      p_phrases: commonP,
      safety_alert: 'Mistura tóxica. Alto risco à saúde. Uso de EPI e ventilação adequada obrigatórios.',
      incompatibilities,
    });
  }

  return buildClassifyResult({
    un_number: 'UN1993',
    proper_shipping_name: 'FLAMMABLE LIQUID, N.O.S.',
    risk_class: '3',
    risk_number: '33',
    pictograms: ['GHS02', 'GHS07'],
    h_phrases: [
      'H226: Flammable liquid and vapour.',
      'H315: Causes skin irritation.',
      'H319: Causes serious eye irritation.',
      'H336: May cause drowsiness or dizziness.',
    ],
    p_phrases: commonP,
    safety_alert: 'Classificação genérica de líquido inflamável. Verificar composição e incompatibilidades antes do manuseio.',
    incompatibilities,
  });
}