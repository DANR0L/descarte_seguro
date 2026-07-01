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

    console.log("RESPOSTA DO MOTOR:", JSON.stringify(detailedResult, null, 2));
    return res.status(200).json(detailedResult);

  } catch (error) {
    console.error('Error in /api/classify:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}

const KEYWORDS = {
  acid_inorganic: [
    "sulfurico", "sulfÃºrico", "nitrico", "nÃ­trico", "cloridrico", "clorÃ­drico",
    "fosforico", "fosfÃ³rico", "fluoridrico", "fluorÃ­drico", "borico", "bÃ³rico",
    "cromico", "crÃ´mico", "perclorico", "perclÃ³rico", "sulfuroso"
  ],
  acid_organic: [
    "acetico", "acÃ©tico", "formico", "fÃ³rmico", "citrico", "cÃ­trico",
    "oxalico", "oxÃ¡lico", "tartarico", "tartÃ¡rico", "latico", "lÃ¡tico",
    "salicilico", "salicÃ­lico", "propionico", "propiÃ³nico", "butirico", "butÃ­rico",
    "benzoico", "benzÃ³ico", "oleico", "olÃ©ico", "esteÃ¡rico"
  ],
  base: [
    "hidroxido", "hidrÃ³xido", "soda", "potassa", "potassio", "potÃ¡ssio",
    "amonia", "amÃ´nia", "hidroxido de sodio", "hidrÃ³xido de sÃ³dio",
    "hidroxido de potassio", "hidrÃ³xido de potÃ¡ssio", "carbonato de sodio",
    "carbonato de sÃ³dio", "bicarbonato", "cal", "calcio", "cÃ¡lcio",
    "magnesio", "magnÃ©sio", "trietilamina", "dietilamina", "etilamina",
    "morfina", "anilina", "piridina", "piperidina", "etanolamina",
    "hidrazina", "ureia", "urÃ©ia"
  ],
  flammable: [
    "alcool", "Ã¡lcool", "etanol", "metanol", "isopropanol", "butanol",
    "acetona", "hexano", "heptano", "pentano", "tolueno", "xileno",
    "benzeno", "solvente", "eter", "Ã©ter", "acetato", "acetato de etila",
    "acetato de butila", "dioxano", "tetrahidrofurano", "thf",
    "ciclohexano", "nafta", "petroleo", "gasolina", "querosene",
    "estireno", "acrilato", "metacrilato", "acetonitrila",
    "dimetilformamida", "dmf", "dissulfeto de carbono", "sulfeto de carbono"
  ],
  oxidizer: [
    "peroxido", "perÃ³xido", "peroxido de hidrogenio", "agua oxygenada",
    "Ã¡gua oxigenada", "clorato", "nitrato", "nitrato de sodio",
    "nitrato de potassio", "permanganato", "dicromato", "cromato",
    "persulfato", "perborato", "perclorato", "hipoclorito",
    "bromato", "iodato", "nitrito", "acido nitrico fumegante",
    "acido perclorico", "acido crÃ´mico"
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
    "hipoclorito", "agua sanitaria", "Ã¡gua sanitÃ¡ria", "cloro ativo",
    "hipoclorito de sodio", "hipoclorito de calcio", "cloro liquido",
    "cloro", "branqueador", "alvejante"
  ],
  formaldehyde: ['formol', 'formaldeido', 'formaldeído'],
    toxic_acute: [
    "cloroformio", "clorofÃ³rmio", "diclorometano", "cloreto de metileno",
    "fenol", "formol", "formaldeido", "formaldeÃ­do",
    "anilina", "acetonitrila", "cianeto", "metanol",
    "tetracloreto de carbono", "tricloroetileno", "percloroetileno",
    "acido fluorÃ­drico", "acido oxÃ¡lico", "nicotina",
    "composto de mercurio", "composto de chumbo", "composto de arsenio",
    "composto de cÃ¡dmio", "composto de cromo hexavalente"
  ],
  heavy_metal: [
    "mercurio", "mercÃºrio", "chumbo", "cadmio", "cÃ¡dmio",
    "arsenio", "arsÃªnio", "cromo hexavalente", "cromo vi",
    "selenio", "selÃªnio", "bario", "bÃ¡rio", "talio", "tÃ¡lio",
    "prata", "vanadio", "vanÃ¡dio", "nÃ­quel", "cobalto"
  ],
  organic_peroxide: [
    "peroxido organico", "perÃ³xido orgÃ¢nico", "peroxido de benzoila",
    "perÃ³xido de benzoÃ­la", "peroxido de cumeno", "perÃ³xido de cumeno",
    "peroxido de terc-butila", "perÃ³xido de terc-butila",
    "peroxido de lauroila", "perÃ³xido de lauroÃ­la", "mekp",
    "peroxido de metiletilcetona", "perÃ³xido de metiletilcetona"
  ],
  halogenated: [
    "cloroformio", "clorofÃ³rmio", "diclorometano", "cloreto de metileno",
    "tetracloreto de carbono", "tricloroetileno", "percloroetileno",
    "clorobenzeno", "clorotolueno", "bromofÃ³rmio",
    "iodofÃ³rmio", "cloreto de etila", "cloreto de metila",
    "freon", "clorofluorcarbono", "cfc", "halogenado"
  ],
  ether: [
    "eter etilico", "Ã©ter etÃ­lico", "eter dietilico", "Ã©ter dietÃ­lico",
    "eter isopropilico", "Ã©ter isopropÃ­lico", "eter de petroleo",
    "Ã©ter de petrÃ³leo", "tetrahidrofurano", "thf", "dioxano",
    "metil terc-butil eter", "mtbe", "dimetoxietano", "glyme"
  ],
  azide: [
    "azida", "azida de sodio", "azida de sÃ³dio", "azida de chumbo",
    "azida de prata", "NaN3"
  ],
  nitro: [
    "nitrobenzeno", "nitrotolueno", "acido picrico", "Ã¡cido pÃ­crico",
    "trinitrotolueno", "tnt", "nitroglicerina", "dinitrofenol",
    "nitrocelulose", "nitrometano", "nitrocomposto"
  ],
  isocyanate: [
    "isocianato", "tdi", "mdi", "hexametileno diisocianato",
    "hdi", "isoforona diisocianato", "ipdi", "uretano", "poliuretano"
  ],
  peroxide_former: [
    "eter etilico", "Ã©ter etÃ­lico", "eter dietilico", "Ã©ter dietÃ­lico",
    "eter isopropilico", "Ã©ter isopropÃ­lico", "tetrahidrofurano", "thf",
    "dioxano", "eter de petroleo", "Ã©ter de petrÃ³leo",
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
    "aluminio", "alumÃ­nio", "zinco", "magnesio", "magnÃ©sio",
    "sodio metalico", "sÃ³dio metÃ¡lico", "potassio metalico",
    "potÃ¡ssio metÃ¡lico", "litio", "lÃ­tio", "calcio metalico",
    "cÃ¡lcio metÃ¡lico", "po de aluminio", "pÃ³ de alumÃ­nio",
    "po de zinco", "pÃ³ de zinco", "po de magnesio", "pÃ³ de magnÃ©sio"
  ],
  water_reactive: [
    "sodio metalico", "sÃ³dio metÃ¡lico", "potassio metalico", "potÃ¡ssio metÃ¡lico",
    "litio", "lÃ­tio", "calcio metalico", "cÃ¡lcio metÃ¡lico",
    "hidreto", "hidreto de sodio", "hidreto de litio e aluminio",
    "lialh4", "boreto de sodio", "boro-hidreto", "naBH4",
    "hidreto de calcio", "caH2", "metal alcalino", "metal alcalino terroso"
  ],
  polymerizable: [
    "estireno", "acrilato de metila", "acrilato de butila",
    "metacrilato de metila", "acido acrilico", "acrÃ­lico",
    "acrilonitrila", "vinil", "cloreto de vinila", "acetato de vinila",
    "formaldeido", "formaldeÃ­do", "epoxi", "Ã³xido de etileno",
    "isocianato", "diisocianato", "cianoacrilato"
  ],
  halogen: [
    "cloro", "cloro gasoso", "bromo", "iodo", "fluor", "flÃºor"
  ],
  radioactive: [
    "uranio", "urÃ¢nio", "torio", "tÃ³rio", "radio", "rÃ¡dio",
    "cesio", "cÃ©sio", "cobalto-60", "tecnecio", "tecnÃ©cio",
    "americio", "amerÃ­cio", "iodo-131", "fosforo-32", "fÃ³sforo-32",
    "tritio", "trÃ­tio", "carbono-14", "radioativo", "radioisotopo"
  ],
  organophosphate: [
    "organofosforado", "paration", "malation", "clorpirifos",
    "diazinon", "glifosato", "metil paration", "fosfato organico",
    "diclorvas", "DDVP"
  ]
};

const INCOMPATIBILITY_MATRIX = [
  { "a": "acid_inorganic", "b": "hypochlorite", "gas": "Cl2", "desc": "[CRITICAL] Ãcidos + Hipocloritos â†’ LiberaÃ§Ã£o de gÃ¡s cloro (Cl2) tÃ³xico, asfixiante e corrosivo. Evite a mistura; use EPI completo e ventilaÃ§Ã£o." },
  { "a": "acid_organic", "b": "hypochlorite", "gas": "Cl2", "desc": "[CRITICAL] Ãcidos + Hipocloritos â†’ LiberaÃ§Ã£o de gÃ¡s cloro (Cl2) tÃ³xico e corrosivo." },
  { "a": "base", "b": "hypochlorite", "gas": "NH2Cl", "desc": "[CRITICAL] Bases (AmÃ´nia/Aminas) + Hipocloritos â†’ LiberaÃ§Ã£o de Cloraminas (NH2Cl), gases altamente tÃ³xicos e irritantes respiratÃ³rios." },
  { "a": "acid_inorganic", "b": "cyanide", "gas": "HCN", "desc": "[FATAL] Ãcidos + Cianetos â†’ LiberaÃ§Ã£o de GÃ¡s CianÃ­drico (HCN), extremamente tÃ³xico e letal. Risco de morte imediata por inalaÃ§Ã£o." },
  { "a": "acid_organic", "b": "cyanide", "gas": "HCN", "desc": "[FATAL] Ãcidos + Cianetos â†’ LiberaÃ§Ã£o de GÃ¡s CianÃ­drico (HCN), letal por inalaÃ§Ã£o." },
  { "a": "acid_inorganic", "b": "sulfide", "gas": "H2S", "desc": "[FATAL] Ãcidos + Sulfetos â†’ LiberaÃ§Ã£o de GÃ¡s SulfÃ­drico (H2S), altamente tÃ³xico, asfixiante e inflamÃ¡vel." },
  { "a": "acid_organic", "b": "sulfide", "gas": "H2S", "desc": "[FATAL] Ãcidos + Sulfetos â†’ LiberaÃ§Ã£o de GÃ¡s SulfÃ­drico (H2S)." },
  { "a": "oxidizer", "b": "flammable", "gas": null, "desc": "[CRITICAL] Oxidante + InflamÃ¡vel â†’ Risco extremo de incÃªndio e explosÃ£o. ReaÃ§Ã£o violenta e espontÃ¢nea." },
  { "a": "oxidizer", "b": "acid_organic", "gas": null, "desc": "[CRITICAL] Oxidantes + Ãcidos OrgÃ¢nicos â†’ ReaÃ§Ã£o violenta com risco de igniÃ§Ã£o espontÃ¢nea, fervura e explosÃ£o." },
  { "a": "acid_inorganic", "b": "flammable", "gas": "NOx", "desc": "[CRITICAL] Ãcidos InorgÃ¢nicos Fortes (NÃ­trico/SulfÃºrico) + Solventes InflamÃ¡veis â†’ ReaÃ§Ã£o extremamente violenta, risco de explosÃ£o e liberaÃ§Ã£o de gases nitrosos (NOx) letais." },
  { "a": "acid_inorganic", "b": "base", "gas": null, "desc": "[WARNING] Ãcido + Base â†’ ReaÃ§Ã£o de neutralizaÃ§Ã£o fortemente exotÃ©rmica. Risco de fervura, projeÃ§Ã£o de material corrosivo e ruptura do frasco." },
  { "a": "acid_organic", "b": "base", "gas": null, "desc": "[WARNING] Ãcido + Base â†’ ReaÃ§Ã£o de neutralizaÃ§Ã£o exotÃ©rmica. Risco de aquecimento e respingos." },
  { "a": "base", "b": "reactive_metal", "gas": "H2", "desc": "[CRITICAL] Base Forte + Metal Reativo (AlumÃ­nio/Zinco) â†’ LiberaÃ§Ã£o de gÃ¡s hidrogÃªnio (H2), altamente inflamÃ¡vel e explosivo." },
  { "a": "acid_inorganic", "b": "reactive_metal", "gas": "H2", "desc": "[CRITICAL] Ãcido Forte + Metal Reativo â†’ LiberaÃ§Ã£o rÃ¡pida de gÃ¡s hidrogÃªnio (H2), altamente inflamÃ¡vel e explosivo." },
  { "a": "acid_inorganic", "b": "water_reactive", "gas": null, "desc": "[CRITICAL] Ãcidos + Reativos com Ãgua â†’ Risco de explosÃ£o violenta, projeÃ§Ã£o de material corrosivo." },
  { "a": "water_reactive", "b": "flammable", "gas": "H2", "desc": "[CRITICAL] Reativo com Ãgua + Ãgua ou Umidade â†’ LiberaÃ§Ã£o de gÃ¡s hidrogÃªnio (H2) inflamÃ¡vel. Risco de explosÃ£o." },
  { "a": "oxidizer", "b": "ether", "gas": null, "desc": "[CRITICAL] Oxidantes + Ã‰teres â†’ Risco de explosÃ£o violenta. Ã‰teres formam perÃ³xidos instÃ¡veis em contato com oxidantes fortes." },
  { "a": "oxidizer", "b": "organic_peroxide", "gas": null, "desc": "[CRITICAL] Oxidante + PerÃ³xido OrgÃ¢nico â†’ Risco extremo de decomposiÃ§Ã£o explosiva e incÃªndio violento." },
  { "a": "oxidizer", "b": "nitro", "gas": "NOx", "desc": "[CRITICAL] Oxidante + Nitrocomposto â†’ Risco de explosÃ£o e liberaÃ§Ã£o de gases tÃ³xicos (NOx)." },
  { "a": "acid_inorganic", "b": "ether", "gas": null, "desc": "[WARNING] Ãcidos Fortes + Ã‰teres â†’ Risco de reaÃ§Ã£o exotÃ©rmica. Ã‰teres podem formar perÃ³xidos explosivos com exposiÃ§Ã£o ao ar." },
  { "a": "acid_inorganic", "b": "halogenated", "gas": null, "desc": "[WARNING] Ãcidos Fortes + Halogenados â†’ Risco de decomposiÃ§Ã£o com liberaÃ§Ã£o de gases corrosivos (HCl, HBr, HF)." },
  { "a": "base", "b": "azide", "gas": "HN3", "desc": "[CRITICAL] Ãcidos + Azidas â†’ LiberaÃ§Ã£o de Ãcido Hidrazoico (HN3), altamente explosivo e tÃ³xico. Risco de detonaÃ§Ã£o." },
  { "a": "acid_inorganic", "b": "azide", "gas": "HN3", "desc": "[FATAL] Ãcidos + Azidas â†’ LiberaÃ§Ã£o de Ãcido Hidrazoico (HN3) gasoso, extremamente explosivo e letal." },
  { "a": "oxidizer", "b": "hypochlorite", "gas": "Cl2", "desc": "[CRITICAL] Oxidantes Fortes + Hipocloritos â†’ LiberaÃ§Ã£o de gÃ¡s cloro (Cl2) violento e reaÃ§Ã£o exotÃ©rmica descontrolada." },
  { "a": "oxidizer", "b": "phenol", "gas": null, "desc": "[CRITICAL] Oxidantes + FenÃ³is â†’ ReaÃ§Ã£o violenta com risco de explosÃ£o e geraÃ§Ã£o de compostos altamente tÃ³xicos." },
  { "a": "base", "b": "nitro", "gas": null, "desc": "[CRITICAL] Bases Fortes + Nitrocompostos â†’ FormaÃ§Ã£o de sais instÃ¡veis e potencial explosivo. Risco de detonaÃ§Ã£o." },
  { "a": "acid_inorganic", "b": "nitro", "gas": null, "desc": "[WARNING] Ãcidos Fortes + Nitrocompostos â†’ SensibilizaÃ§Ã£o do composto explosivo. Risco de detonaÃ§Ã£o por choque ou calor." },
  { "a": "oxidizer", "b": "water_reactive", "gas": null, "desc": "[CRITICAL] Oxidante + Reativo com Ãgua â†’ ReaÃ§Ã£o violenta com formaÃ§Ã£o de gases tÃ³xicos e risco de explosÃ£o." },
  { "a": "base", "b": "organophosphate", "gas": null, "desc": "[CRITICAL] Bases Fortes + Organofosforados â†’ HidrÃ³lise alcalina gerando subprodutos tÃ³xicos. ReaÃ§Ã£o exotÃ©rmica perigosa." },
  { "a": "acid_inorganic", "b": "organophosphate", "gas": null, "desc": "[WARNING] Ãcidos + Organofosforados â†’ Risco de decomposiÃ§Ã£o gerando gases tÃ³xicos (fosfina, PH3)." },
  { "a": "oxidizer", "b": "amine", "gas": "NOx", "desc": "[CRITICAL] Oxidantes + Aminas â†’ ReaÃ§Ã£o violenta com liberaÃ§Ã£o de gases nitrosos tÃ³xicos e risco de incÃªndio." },
  { "a": "acid_inorganic", "b": "amine", "gas": null, "desc": "[WARNING] Ãcidos + Aminas â†’ ReaÃ§Ã£o exotÃ©rmica de salificaÃ§Ã£o. Risco de fervura e respingos corrosivos." },
  { "a": "base", "b": "amine", "gas": "NH3", "desc": "[WARNING] Bases Fortes + Sais de Amina â†’ LiberaÃ§Ã£o de amÃ´nia (NH3) gasosa, irritante e tÃ³xica." },
  { "a": "oxidizer", "b": "halogen", "gas": null, "desc": "[CRITICAL] Oxidantes + HalogÃªnios (Cloro/Bromo) â†’ ReaÃ§Ã£o violenta com risco de explosÃ£o e liberaÃ§Ã£o de gases altamente tÃ³xicos." },
  { "a": "hypochlorite", "b": "amine", "gas": "NH2Cl", "desc": "[CRITICAL] Hipocloritos + Aminas â†’ LiberaÃ§Ã£o de Cloraminas (NH2Cl e derivados), gases altamente tÃ³xicos e irritantes." },
  { "a": "ether", "b": "oxidizer", "gas": null, "desc": "[CRITICAL] Ã‰teres + Oxidantes â†’ Ã‰teres acumulam perÃ³xidos explosivos. Risco de detonaÃ§Ã£o por fricÃ§Ã£o ou choque." },
  { "a": "ether", "b": "ether", "gas": null, "desc": "[WARNING] Ã‰teres presentes. Formam perÃ³xidos explosivos com o tempo. NÃ£o destilar atÃ© volume seco." },
  { "a": "nitro", "b": "nitro", "gas": null, "desc": "[CRITICAL] Nitrocompostos presentes. Avaliar risco de explosÃ£o. ConcentraÃ§Ãµes >5% podem exigir classificaÃ§Ã£o de Explosivo (Classe 1.1)." }
];

const CLASSIFICATION_RULES = [
  {
    conditions: ["oxidizer", "flammable"],
    un_number: "UN3139",
    proper_shipping_name: "LÃQUIDO OXIDANTE, N.E.",
    risk_class: "5.1",
    pictograms: ["GHS03", "GHS02"],
    h_phrases: ["H272", "H225"]
  },
  {
    conditions: ["heavy_metal"],
    un_number: "UN3288",
    proper_shipping_name: "SÃ“LIDO TÃ“XICO, INORGÃ‚NICO, N.E.",
    risk_class: "6.1",
    pictograms: ["GHS06", "GHS09"],
    h_phrases: ["H301", "H410"]
  },
  {
    conditions: ["organic_peroxide"],
    un_number: "UN3107",
    proper_shipping_name: "PERÃ“XIDO ORGÃ‚NICO TIPO D, LÃQUIDO",
    risk_class: "5.2",
    pictograms: ["GHS01", "GHS02"],
    h_phrases: ["H242"]
  },
  {
    conditions: ["nitro"],
    un_number: "UN0473",
    proper_shipping_name: "SUBSTÃ‚NCIA EXPLOSIVA, N.E.",
    risk_class: "1.1A",
    pictograms: ["GHS01"],
    h_phrases: ["H201"]
  },
  {
    conditions: ["ether"],
    un_number: "UN3271",
    proper_shipping_name: "Ã‰TERES, N.E.",
    risk_class: "3",
    pictograms: ["GHS02"],
    h_phrases: ["H225", "H019"]
  },
  {
    conditions: ["water_reactive"],
    un_number: "UN3134",
    proper_shipping_name: "LÃQUIDO REATIVO COM ÃGUA, TÃ“XICO, N.E.",
    risk_class: "4.3",
    pictograms: ["GHS02", "GHS06"],
    h_phrases: ["H260"]
  },
  {
    conditions: ["isocyanate"],
    un_number: "UN2206",
    proper_shipping_name: "ISOCIANATOS, TÃ“XICOS, N.E.",
    risk_class: "6.1",
    pictograms: ["GHS06", "GHS08"],
    h_phrases: ["H302", "H334"]
  },
  {
    conditions: ["halogenated"],
    un_number: "UN3082",
    proper_shipping_name: "SUBSTÃ‚NCIA QUE APRESENTA RISCO PARA O MEIO AMBIENTE, LÃQUIDA, N.E.",
    risk_class: "9",
    pictograms: ["GHS09"],
    h_phrases: ["H411"]
  },
  {
    conditions: ["flammable", "toxic_acute", "acid_inorganic"],
    un_number: "UN3286",
    proper_shipping_name: "LÃQUIDO INFLAMÃVEL, TÃ“XICO, CORROSIVO, N.E.",
    risk_class: "3 (6.1, 8)",
    pictograms: ["GHS02", "GHS06", "GHS05"],
    h_phrases: ["H225", "H301", "H311", "H331", "H314"]
  },
  {
    conditions: ["flammable", "toxic_acute", "acid_organic"],
    un_number: "UN3286",
    proper_shipping_name: "LÃQUIDO INFLAMÃVEL, TÃ“XICO, CORROSIVO, N.E.",
    risk_class: "3 (6.1, 8)",
    pictograms: ["GHS02", "GHS06", "GHS05"],
    h_phrases: ["H225", "H301", "H311", "H331", "H314"]
  },
  {
    conditions: ["flammable", "toxic_acute", "base"],
    un_number: "UN3286",
    proper_shipping_name: "LÃQUIDO INFLAMÃVEL, TÃ“XICO, CORROSIVO, N.E.",
    risk_class: "3 (6.1, 8)",
    pictograms: ["GHS02", "GHS06", "GHS05"],
    h_phrases: ["H225", "H301", "H311", "H331", "H314"]
  },
  {
    conditions: ["flammable", "toxic_acute"],
    un_number: "UN1992",
    proper_shipping_name: "LÃQUIDO INFLAMÃVEL, TÃ“XICO, N.E.",
    risk_class: "3 (6.1)",
    pictograms: ["GHS02", "GHS06"],
    h_phrases: ["H225", "H301", "H311", "H331"]
  },
  {
    conditions: ["flammable", "acid_inorganic"],
    un_number: "UN2924",
    proper_shipping_name: "LÃQUIDO INFLAMÃVEL, CORROSIVO, N.E.",
    risk_class: "3 (8)",
    pictograms: ["GHS02", "GHS05"],
    h_phrases: ["H225", "H314"]
  },
  {
    conditions: ["flammable", "acid_organic"],
    un_number: "UN2924",
    proper_shipping_name: "LÃQUIDO INFLAMÃVEL, CORROSIVO, N.E.",
    risk_class: "3 (8)",
    pictograms: ["GHS02", "GHS05"],
    h_phrases: ["H225", "H314"]
  },
  {
    conditions: ["flammable", "base"],
    un_number: "UN2924",
    proper_shipping_name: "LÃQUIDO INFLAMÃVEL, CORROSIVO, N.E.",
    risk_class: "3 (8)",
    pictograms: ["GHS02", "GHS05"],
    h_phrases: ["H225", "H314"]
  },
  {
    conditions: ["toxic_acute", "acid_inorganic"],
    un_number: "UN2922",
    proper_shipping_name: "LÃQUIDO CORROSIVO, TÃ“XICO, N.E.",
    risk_class: "8 (6.1)",
    pictograms: ["GHS05", "GHS06"],
    h_phrases: ["H314", "H301", "H311", "H331"]
  },
  {
    conditions: ["toxic_acute", "acid_organic"],
    un_number: "UN2922",
    proper_shipping_name: "LÃQUIDO CORROSIVO, TÃ“XICO, N.E.",
    risk_class: "8 (6.1)",
    pictograms: ["GHS05", "GHS06"],
    h_phrases: ["H314", "H301", "H311", "H331"]
  },
  {
    conditions: ["toxic_acute", "base"],
    un_number: "UN2922",
    proper_shipping_name: "LÃQUIDO CORROSIVO, TÃ“XICO, N.E.",
    risk_class: "8 (6.1)",
    pictograms: ["GHS05", "GHS06"],
    h_phrases: ["H314", "H301", "H311", "H331"]
  },
  {
    conditions: ["flammable"],
    un_number: "UN1993",
    proper_shipping_name: "LÃQUIDO INFLAMÃVEL, N.E.",
    risk_class: "3",
    pictograms: ["GHS02", "GHS07"],
    h_phrases: ["H225", "H319", "H336"]
  },
  {
    conditions: ["toxic_acute"],
    un_number: "UN2810",
    proper_shipping_name: "LÃQUIDO TÃ“XICO, ORGÃ‚NICO, N.E.",
    risk_class: "6.1",
    pictograms: ["GHS06", "GHS08"],
    h_phrases: ["H301", "H311", "H331", "H370"]
  },
  {
    conditions: ["acid_inorganic"],
    un_number: "UN3264",
    proper_shipping_name: "LÃQUIDO CORROSIVO, ÃCIDO, INORGÃ‚NICO, N.E.",
    risk_class: "8",
    pictograms: ["GHS05", "GHS07"],
    h_phrases: ["H290", "H314", "H335"]
  },
  {
    conditions: ["acid_organic"],
    un_number: "UN3265",
    proper_shipping_name: "LÃQUIDO CORROSIVO, ÃCIDO, ORGÃ‚NICO, N.E.",
    risk_class: "8",
    pictograms: ["GHS05", "GHS07"],
    h_phrases: ["H290", "H314", "H335"]
  },
  {
    conditions: ["base"],
    un_number: "UN3266",
    proper_shipping_name: "LÃQUIDO CORROSIVO, BÃSICO, INORGÃ‚NICO, N.E.",
    risk_class: "8",
    pictograms: ["GHS05", "GHS07"],
    h_phrases: ["H290", "H314"]
  },
  {
    conditions: ["oxidizer"],
    un_number: "UN3139",
    proper_shipping_name: "LÃQUIDO OXIDANTE, N.E.",
    risk_class: "5.1",
    pictograms: ["GHS03", "GHS07"],
    h_phrases: ["H272", "H315", "H319"]
  }
];

const H_PHRASES = {
  "H225": "LÃ­quido e vapores altamente inflamÃ¡veis.",
  "H226": "LÃ­quido e vapores inflamÃ¡veis.",
  "H272": "Pode agravar incÃªndios; comburente.",
  "H290": "Pode ser corrosivo para os metais.",
  "H301": "TÃ³xico se ingerido.",
  "H311": "TÃ³xico em contato com a pele.",
  "H314": "Provoca queimaduras na pele e lesÃµes oculares graves.",
  "H315": "Provoca irritaÃ§Ã£o cutÃ¢nea.",
  "H319": "Provoca irritaÃ§Ã£o ocular grave.",
  "H331": "TÃ³xico se inalado.",
  "H335": "Pode provocar irritaÃ§Ã£o das vias respiratÃ³rias.",
  "H336": "Pode provocar sonolÃªncia ou vertigens.",
  "H370": "Provoca danos aos Ã³rgÃ£os."
};

const P_PHRASES = {
  "P210": "Manter afastado do calor, faÃ­scas, chamas abertas e superfÃ­cies quentes. NÃ£o fumar.",
  "P233": "Manter o recipiente bem fechado.",
  "P235": "Conservar em ambiente fresco.",
  "P260": "NÃ£o respirar as poeiras/fumos/gases/nÃ©voas/vapores/aerossÃ³is.",
  "P264": "Lavar as mÃ£os cuidadosamente apÃ³s manuseamento.",
  "P271": "Utilizar apenas ao ar livre ou em locais bem ventilados.",
  "P280": "Usar luvas de proteÃ§Ã£o/vestuÃ¡rio de proteÃ§Ã£o/proteÃ§Ã£o ocular/proteÃ§Ã£o facial.",
  "P301+P310": "EM CASO DE INGESTÃƒO: Contacte imediatamente um CENTRO DE INFORMAÃ‡ÃƒO ANTIVENENOS ou um mÃ©dico.",
  "P303+P361+P353": "SE ENTRAR EM CONTACTO COM A PELE (ou o cabelo): despir/retirar imediatamente toda a roupa contaminada. Enxaguar a pele com Ã¡gua/tomar um duche.",
  "P304+P340": "EM CASO DE INALAÃ‡ÃƒO: retirar a vÃ­tima para uma zona ao ar livre e mantÃª-la em repouso numa posiÃ§Ã£o que nÃ£o dificulte a respiraÃ§Ã£o.",
  "P305+P351+P338": "SE ENTRAR EM CONTACTO COM OS OLHOS: enxaguar cuidadosamente com Ã¡gua durante vÃ¡rios minutos. Se usar lentes de contacto, retire-as, se tal lhe for possÃ­vel. Continuar a enxaguar.",
  "P310": "Contacte imediatamente um CENTRO DE INFORMAÃ‡ÃƒO ANTIVENENOS ou um mÃ©dico.",
  "P403+P235": "Armazenar em local bem ventilado. Conservar em ambiente fresco.",
  "P405": "Armazenar em local fechado Ã  chave.",
  "P501": "Eliminar o conteÃºdo/recipiente de acordo com a legislaÃ§Ã£o local/regional/nacional/internacional."
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
  return keywords.some((kw) => {
    const kwNorm = normalize(kw);
    return new RegExp(`\\b${kwNorm}\\b`).test(normalized);
  });
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

  let safety_alert = '';
  if (incompatibilities.length > 0) {
    safety_alert = incompatibilities.map(i => i.description).join('\n\n');
  }

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
        safety_alert: safety_alert || 'Mistura complexa nÃ£o listada. Consulte um especialista.',
        incompatibilities
      };
    } else {
      return {
        un_number: 'UN0000',
        proper_shipping_name: 'NÃƒO CLASSIFICADO COMO PERIGOSO',
        risk_class: '',
        risk_number: '',
        pictograms: [],
        h_phrases: [],
        p_phrases: [],
        safety_alert: safety_alert || 'Mistura nÃ£o apresenta riscos primÃ¡rios nas categorias avaliadas.',
        incompatibilities
      };
    }
  }

  return {
    un_number: matchedRule.un_number,
    proper_shipping_name: matchedRule.proper_shipping_name,
    risk_class: matchedRule.risk_class,
    risk_number: '',
    pictograms: matchedRule.pictograms,
    h_phrases: matchedRule.h_phrases,
    p_phrases: defaultPPhrases,
    safety_alert: safety_alert || 'Mistura classificada com sucesso. Siga as instruÃ§Ãµes de armazenamento e descarte adequadas.',
    incompatibilities
  };
}
