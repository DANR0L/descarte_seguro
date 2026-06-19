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
  acid_inorganic: [
    "sulfurico", "sulfúrico", "nitrico", "nítrico", "cloridrico", "clorídrico",
    "fosforico", "fosfórico", "fluoridrico", "fluorídrico", "borico", "bórico",
    "cromico", "crômico", "perclorico", "perclórico", "sulfuroso"
  ],
  acid_organic: [
    "acetico", "acético", "formico", "fórmico", "citrico", "cítrico",
    "oxalico", "oxálico", "tartarico", "tartárico", "latico", "lático",
    "salicilico", "salicílico", "propionico", "propiónico", "butirico", "butírico",
    "benzoico", "benzóico", "oleico", "oléico", "esteárico"
  ],
  base: [
    "hidroxido", "hidróxido", "soda", "potassa", "potassio", "potássio",
    "amonia", "amônia", "hidroxido de sodio", "hidróxido de sódio",
    "hidroxido de potassio", "hidróxido de potássio", "carbonato de sodio",
    "carbonato de sódio", "bicarbonato", "cal", "calcio", "cálcio",
    "magnesio", "magnésio", "trietilamina", "dietilamina", "etilamina",
    "morfina", "anilina", "piridina", "piperidina", "etanolamina",
    "hidrazina", "ureia", "uréia"
  ],
  flammable: [
    "alcool", "álcool", "etanol", "metanol", "isopropanol", "butanol",
    "acetona", "hexano", "heptano", "pentano", "tolueno", "xileno",
    "benzeno", "solvente", "eter", "éter", "acetato", "acetato de etila",
    "acetato de butila", "dioxano", "tetrahidrofurano", "thf",
    "ciclohexano", "nafta", "petroleo", "gasolina", "querosene",
    "estireno", "acrilato", "metacrilato", "acetonitrila",
    "dimetilformamida", "dmf", "dissulfeto de carbono", "sulfeto de carbono"
  ],
  oxidizer: [
    "peroxido", "peróxido", "peroxido de hidrogenio", "agua oxygenada",
    "água oxigenada", "clorato", "nitrato", "nitrato de sodio",
    "nitrato de potassio", "permanganato", "dicromato", "cromato",
    "persulfato", "perborato", "perclorato", "hipoclorito",
    "bromato", "iodato", "nitrito", "acido nitrico fumegante",
    "acido perclorico", "acido crômico"
  ],
  cyanide: [
    "cianeto", "cyanide", "cianeto de sodio", "cianeto de potassio",
    "cianeto de hidrogenio", "acido cianidrico",
    "ferrocianeto", "ferricianeto"
  ],
  sulfide: [
    "sulfeto", "sulfide", "sulfeto de sodio", "sulfeto de potassio",
    "sulfeto de hidrogenio", "acido sulfidrico", "mercaptana",
    "tiol", "dissulfeto de carbono"
  ],
  hypochlorite: [
    "hipoclorito", "agua sanitaria", "água sanitária", "cloro ativo",
    "hipoclorito de sodio", "hipoclorito de calcio", "cloro liquido",
    "cloro", "branqueador", "alvejante"
  ],
  toxic_acute: [
    "cloroformio", "clorofórmio", "diclorometano", "cloreto de metileno",
    "fenol", "formol", "formaldeido", "formaldeído",
    "anilina", "acetonitrila", "cianeto", "metanol",
    "tetracloreto de carbono", "tricloroetileno", "percloroetileno",
    "acido fluorídrico", "acido oxálico", "nicotina",
    "composto de mercurio", "composto de chumbo", "composto de arsenio",
    "composto de cádmio", "composto de cromo hexavalente"
  ],
  heavy_metal: [
    "mercurio", "mercúrio", "chumbo", "cadmio", "cádmio",
    "arsenio", "arsênio", "cromo hexavalente", "cromo vi",
    "selenio", "selênio", "bario", "bário", "talio", "tálio",
    "prata", "vanadio", "vanádio", "níquel", "cobalto"
  ],
  organic_peroxide: [
    "peroxido organico", "peróxido orgânico", "peroxido de benzoila",
    "peróxido de benzoíla", "peroxido de cumeno", "peróxido de cumeno",
    "peroxido de terc-butila", "peróxido de terc-butila",
    "peroxido de lauroila", "peróxido de lauroíla", "mekp",
    "peroxido de metiletilcetona", "peróxido de metiletilcetona"
  ],
  halogenated: [
    "cloroformio", "clorofórmio", "diclorometano", "cloreto de metileno",
    "tetracloreto de carbono", "tricloroetileno", "percloroetileno",
    "clorobenzeno", "clorotolueno", "bromofórmio",
    "iodofórmio", "cloreto de etila", "cloreto de metila",
    "freon", "clorofluorcarbono", "cfc", "halogenado"
  ],
  ether: [
    "eter etilico", "éter etílico", "eter dietilico", "éter dietílico",
    "eter isopropilico", "éter isopropílico", "eter de petroleo",
    "éter de petróleo", "tetrahidrofurano", "thf", "dioxano",
    "metil terc-butil eter", "mtbe", "dimetoxietano", "glyme"
  ],
  azide: [
    "azida", "azida de sodio", "azida de sódio", "azida de chumbo",
    "azida de prata", "NaN3"
  ],
  nitro: [
    "nitrobenzeno", "nitrotolueno", "acido picrico", "ácido pícrico",
    "trinitrotolueno", "tnt", "nitroglicerina", "dinitrofenol",
    "nitrocelulose", "nitrometano", "nitrocomposto"
  ],
  isocyanate: [
    "isocianato", "tdi", "mdi", "hexametileno diisocianato",
    "hdi", "isoforona diisocianato", "ipdi", "uretano", "poliuretano"
  ],
  peroxide_former: [
    "eter etilico", "éter etílico", "eter dietilico", "éter dietílico",
    "eter isopropilico", "éter isopropílico", "tetrahidrofurano", "thf",
    "dioxano", "eter de petroleo", "éter de petróleo",
    "isopropanol", "alcool isopropilico", "dimetoxietano"
  ],
  phenol: [
    "fenol", "cresol", "xilenol", "hidroquinona", "resorcinol",
    "bisfenol a", "bpa", "naftol", "timol"
  ],
  amine: [
    "anilina", "trietilamina", "dietilamina", "etilamina",
    "butilamina", "propilamina", "etanolamina",
    "dimetilamina", "trimetilamina", "ciclohexilamina",
    "benzilamina", "toluidina", "m-fenilenodiamina"
  ],
  reactive_metal: [
    "aluminio", "alumínio", "zinco", "magnesio", "magnésio",
    "sodio metalico", "sódio metálico", "potassio metalico",
    "potássio metálico", "litio", "lítio", "calcio metalico",
    "cálcio metálico", "po de aluminio", "pó de alumínio",
    "po de zinco", "pó de zinco", "po de magnesio", "pó de magnésio"
  ],
  water_reactive: [
    "sodio metalico", "sódio metálico", "potassio metalico", "potássio metálico",
    "litio", "lítio", "calcio metalico", "cálcio metálico",
    "hidreto", "hidreto de sodio", "hidreto de litio e aluminio",
    "lialh4", "boreto de sodio", "boro-hidreto", "naBH4",
    "hidreto de calcio", "caH2", "metal alcalino", "metal alcalino terroso"
  ],
  polymerizable: [
    "estireno", "acrilato de metila", "acrilato de butila",
    "metacrilato de metila", "acido acrilico", "acrílico",
    "acrilonitrila", "vinil", "cloreto de vinila", "acetato de vinila",
    "formaldeido", "formaldeído", "epoxi", "óxido de etileno",
    "isocianato", "diisocianato", "cianoacrilato"
  ],
  halogen: [
    "cloro", "cloro gasoso", "bromo", "iodo", "fluor", "flúor"
  ],
  radioactive: [
    "uranio", "urânio", "torio", "tório", "radio", "rádio",
    "cesio", "césio", "cobalto-60", "tecnecio", "tecnécio",
    "americio", "amerício", "iodo-131", "fosforo-32", "fósforo-32",
    "tritio", "trítio", "carbono-14", "radioativo", "radioisotopo"
  ],
  organophosphate: [
    "organofosforado", "paration", "malation", "clorpirifos",
    "diazinon", "glifosato", "metil paration", "fosfato organico",
    "diclorvas", "DDVP"
  ]
};

const INCOMPATIBILITY_MATRIX = [
  { "a": "acid_inorganic", "b": "hypochlorite", "gas": "Cl2", "desc": "[CRITICAL] Ácidos + Hipocloritos → Liberação de gás cloro (Cl2) tóxico, asfixiante e corrosivo. Evite a mistura; use EPI completo e ventilação." },
  { "a": "acid_organic", "b": "hypochlorite", "gas": "Cl2", "desc": "[CRITICAL] Ácidos + Hipocloritos → Liberação de gás cloro (Cl2) tóxico e corrosivo." },
  { "a": "base", "b": "hypochlorite", "gas": "NH2Cl", "desc": "[CRITICAL] Bases (Amônia/Aminas) + Hipocloritos → Liberação de Cloraminas (NH2Cl), gases altamente tóxicos e irritantes respiratórios." },
  { "a": "acid_inorganic", "b": "cyanide", "gas": "HCN", "desc": "[FATAL] Ácidos + Cianetos → Liberação de Gás Cianídrico (HCN), extremamente tóxico e letal. Risco de morte imediata por inalação." },
  { "a": "acid_organic", "b": "cyanide", "gas": "HCN", "desc": "[FATAL] Ácidos + Cianetos → Liberação de Gás Cianídrico (HCN), letal por inalação." },
  { "a": "acid_inorganic", "b": "sulfide", "gas": "H2S", "desc": "[FATAL] Ácidos + Sulfetos → Liberação de Gás Sulfídrico (H2S), altamente tóxico, asfixiante e inflamável." },
  { "a": "acid_organic", "b": "sulfide", "gas": "H2S", "desc": "[FATAL] Ácidos + Sulfetos → Liberação de Gás Sulfídrico (H2S)." },
  { "a": "oxidizer", "b": "flammable", "gas": null, "desc": "[CRITICAL] Oxidante + Inflamável → Risco extremo de incêndio e explosão. Reação violenta e espontânea." },
  { "a": "oxidizer", "b": "acid_organic", "gas": null, "desc": "[CRITICAL] Oxidantes + Ácidos Orgânicos → Reação violenta com risco de ignição espontânea, fervura e explosão." },
  { "a": "acid_inorganic", "b": "flammable", "gas": "NOx", "desc": "[CRITICAL] Ácidos Inorgânicos Fortes (Nítrico/Sulfúrico) + Solventes Inflamáveis → Reação extremamente violenta, risco de explosão e liberação de gases nitrosos (NOx) letais." },
  { "a": "acid_inorganic", "b": "base", "gas": null, "desc": "[WARNING] Ácido + Base → Reação de neutralização fortemente exotérmica. Risco de fervura, projeção de material corrosivo e ruptura do frasco." },
  { "a": "acid_organic", "b": "base", "gas": null, "desc": "[WARNING] Ácido + Base → Reação de neutralização exotérmica. Risco de aquecimento e respingos." },
  { "a": "base", "b": "reactive_metal", "gas": "H2", "desc": "[CRITICAL] Base Forte + Metal Reativo (Alumínio/Zinco) → Liberação de gás hidrogênio (H2), altamente inflamável e explosivo." },
  { "a": "acid_inorganic", "b": "reactive_metal", "gas": "H2", "desc": "[CRITICAL] Ácido Forte + Metal Reativo → Liberação rápida de gás hidrogênio (H2), altamente inflamável e explosivo." },
  { "a": "acid_inorganic", "b": "water_reactive", "gas": null, "desc": "[CRITICAL] Ácidos + Reativos com Água → Risco de explosão violenta, projeção de material corrosivo." },
  { "a": "water_reactive", "b": "flammable", "gas": "H2", "desc": "[CRITICAL] Reativo com Água + Água ou Umidade → Liberação de gás hidrogênio (H2) inflamável. Risco de explosão." },
  { "a": "oxidizer", "b": "ether", "gas": null, "desc": "[CRITICAL] Oxidantes + Éteres → Risco de explosão violenta. Éteres formam peróxidos instáveis em contato com oxidantes fortes." },
  { "a": "oxidizer", "b": "organic_peroxide", "gas": null, "desc": "[CRITICAL] Oxidante + Peróxido Orgânico → Risco extremo de decomposição explosiva e incêndio violento." },
  { "a": "oxidizer", "b": "nitro", "gas": "NOx", "desc": "[CRITICAL] Oxidante + Nitrocomposto → Risco de explosão e liberação de gases tóxicos (NOx)." },
  { "a": "acid_inorganic", "b": "ether", "gas": null, "desc": "[WARNING] Ácidos Fortes + Éteres → Risco de reação exotérmica. Éteres podem formar peróxidos explosivos com exposição ao ar." },
  { "a": "acid_inorganic", "b": "halogenated", "gas": null, "desc": "[WARNING] Ácidos Fortes + Halogenados → Risco de decomposição com liberação de gases corrosivos (HCl, HBr, HF)." },
  { "a": "base", "b": "azide", "gas": "HN3", "desc": "[CRITICAL] Ácidos + Azidas → Liberação de Ácido Hidrazoico (HN3), altamente explosivo e tóxico. Risco de detonação." },
  { "a": "acid_inorganic", "b": "azide", "gas": "HN3", "desc": "[FATAL] Ácidos + Azidas → Liberação de Ácido Hidrazoico (HN3) gasoso, extremamente explosivo e letal." },
  { "a": "oxidizer", "b": "hypochlorite", "gas": "Cl2", "desc": "[CRITICAL] Oxidantes Fortes + Hipocloritos → Liberação de gás cloro (Cl2) violento e reação exotérmica descontrolada." },
  { "a": "oxidizer", "b": "phenol", "gas": null, "desc": "[CRITICAL] Oxidantes + Fenóis → Reação violenta com risco de explosão e geração de compostos altamente tóxicos." },
  { "a": "base", "b": "nitro", "gas": null, "desc": "[CRITICAL] Bases Fortes + Nitrocompostos → Formação de sais instáveis e potencial explosivo. Risco de detonação." },
  { "a": "acid_inorganic", "b": "nitro", "gas": null, "desc": "[WARNING] Ácidos Fortes + Nitrocompostos → Sensibilização do composto explosivo. Risco de detonação por choque ou calor." },
  { "a": "oxidizer", "b": "water_reactive", "gas": null, "desc": "[CRITICAL] Oxidante + Reativo com Água → Reação violenta com formação de gases tóxicos e risco de explosão." },
  { "a": "base", "b": "organophosphate", "gas": null, "desc": "[CRITICAL] Bases Fortes + Organofosforados → Hidrólise alcalina gerando subprodutos tóxicos. Reação exotérmica perigosa." },
  { "a": "acid_inorganic", "b": "organophosphate", "gas": null, "desc": "[WARNING] Ácidos + Organofosforados → Risco de decomposição gerando gases tóxicos (fosfina, PH3)." },
  { "a": "oxidizer", "b": "amine", "gas": "NOx", "desc": "[CRITICAL] Oxidantes + Aminas → Reação violenta com liberação de gases nitrosos tóxicos e risco de incêndio." },
  { "a": "acid_inorganic", "b": "amine", "gas": null, "desc": "[WARNING] Ácidos + Aminas → Reação exotérmica de salificação. Risco de fervura e respingos corrosivos." },
  { "a": "base", "b": "amine", "gas": "NH3", "desc": "[WARNING] Bases Fortes + Sais de Amina → Liberação de amônia (NH3) gasosa, irritante e tóxica." },
  { "a": "oxidizer", "b": "halogen", "gas": null, "desc": "[CRITICAL] Oxidantes + Halogênios (Cloro/Bromo) → Reação violenta com risco de explosão e liberação de gases altamente tóxicos." },
  { "a": "hypochlorite", "b": "amine", "gas": "NH2Cl", "desc": "[CRITICAL] Hipocloritos + Aminas → Liberação de Cloraminas (NH2Cl e derivados), gases altamente tóxicos e irritantes." },
  { "a": "ether", "b": "oxidizer", "gas": null, "desc": "[CRITICAL] Éteres + Oxidantes → Éteres acumulam peróxidos explosivos. Risco de detonação por fricção ou choque." },
  { "a": "ether", "b": "ether", "gas": null, "desc": "[WARNING] Éteres presentes. Formam peróxidos explosivos com o tempo. Não destilar até volume seco." },
  { "a": "nitro", "b": "nitro", "gas": null, "desc": "[CRITICAL] Nitrocompostos presentes. Avaliar risco de explosão. Concentrações >5% podem exigir classificação de Explosivo (Classe 1.1)." }
];

const CLASSIFICATION_RULES = [
  {
    conditions: ["oxidizer", "flammable"],
    un_number: "UN3139",
    proper_shipping_name: "LÍQUIDO OXIDANTE, N.E.",
    risk_class: "5.1",
    pictograms: ["GHS03", "GHS02"],
    h_phrases: ["H272", "H225"]
  },
  {
    conditions: ["heavy_metal"],
    un_number: "UN3288",
    proper_shipping_name: "SÓLIDO TÓXICO, INORGÂNICO, N.E.",
    risk_class: "6.1",
    pictograms: ["GHS06", "GHS09"],
    h_phrases: ["H301", "H410"]
  },
  {
    conditions: ["organic_peroxide"],
    un_number: "UN3107",
    proper_shipping_name: "PERÓXIDO ORGÂNICO TIPO D, LÍQUIDO",
    risk_class: "5.2",
    pictograms: ["GHS01", "GHS02"],
    h_phrases: ["H242"]
  },
  {
    conditions: ["nitro"],
    un_number: "UN0473",
    proper_shipping_name: "SUBSTÂNCIA EXPLOSIVA, N.E.",
    risk_class: "1.1A",
    pictograms: ["GHS01"],
    h_phrases: ["H201"]
  },
  {
    conditions: ["ether"],
    un_number: "UN3271",
    proper_shipping_name: "ÉTERES, N.E.",
    risk_class: "3",
    pictograms: ["GHS02"],
    h_phrases: ["H225", "H019"]
  },
  {
    conditions: ["water_reactive"],
    un_number: "UN3134",
    proper_shipping_name: "LÍQUIDO REATIVO COM ÁGUA, TÓXICO, N.E.",
    risk_class: "4.3",
    pictograms: ["GHS02", "GHS06"],
    h_phrases: ["H260"]
  },
  {
    conditions: ["isocyanate"],
    un_number: "UN2206",
    proper_shipping_name: "ISOCIANATOS, TÓXICOS, N.E.",
    risk_class: "6.1",
    pictograms: ["GHS06", "GHS08"],
    h_phrases: ["H302", "H334"]
  },
  {
    conditions: ["halogenated"],
    un_number: "UN3082",
    proper_shipping_name: "SUBSTÂNCIA QUE APRESENTA RISCO PARA O MEIO AMBIENTE, LÍQUIDA, N.E.",
    risk_class: "9",
    pictograms: ["GHS09"],
    h_phrases: ["H411"]
  },
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
    safety_alert = incompatibilities.map(i => i.description).join('\n\n');
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