module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST' });
  }

  const { substances = [] } = req.body || {};

  const GHS_CATEGORIES = {
    CORROSION_SKIN: 'Skin Corrosion/Irritation Category 1',
    CORROSION_EYE: 'Serious Eye Damage Category 1',
    ACUTE_TOXICITY: 'Acute Toxicity Category 4',
    FLAMMABLE_LIQUID: 'Flammable Liquid Category 2',
    OXIDIZING_LIQUID: 'Oxidizing Liquid Category 2',
    ORGANIC_PEROXIDE: 'Organic Peroxide Type D',
    ACUTE_TOXICITY_INHALATION: 'Acute Toxicity Inhalation Category 3',
    SPECIFIC_TARGET_ORGAN: 'Specific Target Organ Toxicity Single Exposure Category 3',
    AQUATIC_ACUTE: 'Acute Aquatic Toxicity Category 1',
    AQUATIC_CHRONIC: 'Chronic Aquatic Toxicity Category 1',
    HEALTH_HAZARD: 'Health Hazard',
    EXCLAMATION_MARK: 'Exclamation Mark',
    ENVIRONMENT: 'Environment',
    GAS_UNDER_PRESSURE: 'Gas Under Pressure',
    COMPRESSED_GAS: 'Compressed Gas'
  };

  const ANTT = {
    CLASS_1: { id: 1, name: 'Explosivos', risk_number: '10', class_code: '1' },
    CLASS_2_1: { id: 2.1, name: 'Gases inflamáveis', risk_number: '23', class_code: '2.1' },
    CLASS_2_2: { id: 2.2, name: 'Gases não inflamáveis/tóxicos', risk_number: '20', class_code: '2.2' },
    CLASS_2_3: { id: 2.3, name: 'Gases tóxicos', risk_number: '26', class_code: '2.3' },
    CLASS_3: { id: 3, name: 'Líquidos inflamáveis', risk_number: '33', class_code: '3' },
    CLASS_4_1: { id: 4.1, name: 'Sólidos inflamáveis', risk_number: '40', class_code: '4.1' },
    CLASS_4_2: { id: 4.2, name: 'Substâncias pirofóricas', risk_number: '42', class_code: '4.2' },
    CLASS_4_3: { id: 4.3, name: 'Substâncias que emitem gases inflamáveis em contato com água', risk_number: '43', class_code: '4.3' },
    CLASS_5_1: { id: 5.1, name: 'Agentes oxidantes', risk_number: '50', class_code: '5.1' },
    CLASS_5_2: { id: 5.2, name: 'Peróxidos orgânicos', risk_number: '52', class_code: '5.2' },
    CLASS_6_1: { id: 6.1, name: 'Tóxicos', risk_number: '60', class_code: '6.1' },
    CLASS_6_2: { id: 6.2, name: 'Materiais infecciosos', risk_number: '62', class_code: '6.2' },
    CLASS_7: { id: 7, name: 'Radioativos', risk_number: '70', class_code: '7' },
    CLASS_8: { id: 8, name: 'Corrosivos', risk_number: '80', class_code: '8' },
    CLASS_9: { id: 9, name: 'Diversos/perigosos à environment', risk_number: '90', class_code: '9' }
  };

  const GHS_PICTOGRAMS = {
    GHS01: { name: 'Exploding Bomb', categories: [GHS_CATEGORIES.EXPLOSIVE] },
    GHS02: { name: 'Flame', categories: [GHS_CATEGORIES.FLAMMABLE_LIQUID, GHS_CATEGORIES.ORGANIC_PEROXIDE] },
    GHS03: { name: 'Flame Over Circle', categories: [GHS_CATEGORIES.OXIDIZING_LIQUID] },
    GHS04: { name: 'Gas Cylinder', categories: [GHS_CATEGORIES.GAS_UNDER_PRESSURE, GHS_CATEGORIES.COMPRESSED_GAS] },
    GHS05: { name: 'Corrosion', categories: [GHS_CATEGORIES.CORROSION_SKIN, GHS_CATEGORIES.CORROSION_EYE] },
    GHS06: { name: 'Skull and Crossbones', categories: [GHS_CATEGORIES.ACUTE_TOXICITY_INHALATION] },
    GHS07: { name: 'Exclamation Mark', categories: [GHS_CATEGORIES.EXCLAMATION_MARK, GHS_CATEGORIES.HEALTH_HAZARD, GHS_CATEGORIES.ACUTE_TOXICITY] },
    GHS08: { name: 'Health Hazard', categories: [GHS_CATEGORIES.SPECIFIC_TARGET_ORGAN, GHS_CATEGORIES.HEALTH_HAZARD] },
    GHS09: { name: 'Environment', categories: [GHS_CATEGORIES.AQUATIC_ACUTE, GHS_CATEGORIES.AQUATIC_CHRONIC] }
  };

  const H_PHRASES = {
    H225: 'Altamente inflamável líquido e vapor.',
    H226: 'Líquido e vapor inflamáveis.',
    H272: 'Pode intensificar o fogo; oxidante.',
    H290: 'Pode ser corrosivo para metais.',
    H300: 'Fatal se ingerido.',
    H301: 'Tóxico se ingerido.',
    H302: 'Nocivo se ingerido.',
    H304: 'Pode ser fatal por aspiração se ingerido.',
    H314: 'Causa queimaduras na pele e lesões oculares graves.',
    H315: 'Provoca irritação cutânea.',
    H318: 'Causa lesões oculares graves.',
    H319: 'Provoca irritação ocular grave.',
    H330: 'Fatal se inalado.',
    H331: 'Tóxico se inalado.',
    H332: 'Nocivo se inalado.',
    H335: 'Pode provocar irritação respiratória.',
    H336: 'Pode provocar sonolência ou tontura.',
    H351: 'Suspeito de provocar cancro.',
    H361: 'Suspeito de afetar a fertilidade ou o feto.',
    H370: 'Provoca lesões nos órgãos.',
    H371: 'Pode provocar lesões nos órgãos.',
    H372: 'Provoca lesões nos órgãos por exposição prolongada ou repetida.',
    H400: 'Muito tóxico para os organismos aquáticos.',
    H410: 'Muito tóxico para os organismos aquáticos, com efeitos prolongados.',
    H412: 'Nocivo para os organismos aquáticos, com efeitos prolongados.'
  };

  const P_PHRASES = {
    P210: 'Mantenha afastado do calor, faíscas, chamas abertas e superfícies quentes. Não fume.',
    P220: 'Mantenha afastado de materiais combustíveis.',
    P221: 'Não misture com materiais combustíveis.',
    P233: 'Mantenha o recipiente hermeticamente fechado.',
    P234: 'Mantenha apenas no recipiente original.',
    P235: 'Mantenha em local fresco.',
    P240: 'Aterre/ligue o recipiente e o equipamento de receção.',
    P241: 'Utilize equipamento elétrico de proteção contra explosões.',
    P242: 'Utilize apenas ferramentas anti-faísca.',
    P243: 'Tome medidas de precaução contra descargas eletrostáticas.',
    P260: 'Não respire poeira/fumo/gás/névoa/vapor/aerosol.',
    P261: 'Evite respirar poeira/fumo/gás/névoa/vapor/aerosol.',
    P264: 'Lave as mãos e a face após o manuseamento.',
    P270: 'Não coma, beba ou fume durante a utilização.',
    P271: 'Utilize apenas em exterior ou em local bem ventilado.',
    P273: 'Evite a libertação para o ambiente.',
    P280: 'Use luvas de proteção/roupa de proteção/proteção ocular/proteção de rosto.',
    P281: 'Use equipamento de proteção individual conforme necessário.',
    P301: 'EM CASO DE INGESTÃO:',
    P301_P330_P331: 'EM CASO DE INGESTÃO: enxague a boca. Não provoque o vómito.',
    P302: 'EM CASO DE CONTATO COM A PELE:',
    P302_P352: 'EM CASO DE CONTATO COM A PELE: lave com sabão e água.',
    P303: 'EM CASO DE CONTATO COM A PELE (ou cabelo):',
    P304: 'EM CASO DE INALAÇÃO:',
    P305: 'EM CASO DE CONTATO COM OS OLHOS:',
    P306: 'EM CASO DE CONTATO COM A ROUPA:',
    P310: 'Contacte imediatamente um centro de toxicologia/médico.',
    P312: 'Contacte um centro de toxicologia/médico se sentir indisposto.',
    P313: 'Consulte um médico.',
    P314: 'Consulte um médico se sentir indisposto.',
    P330: 'Enxague a boca.',
    P331: 'Não provoque o vómito.',
    P332: 'Se sentir irritação cutânea:',
    P333: 'Se ocorrer irritação ou erupção cutânea:',
    P334: 'Molhe com água/encalhe.',
    P335: 'Sacuda as partículas soltas da pele.',
    P337: 'Se a irritação ocular persistir:',
    P342: 'Se sentir dificuldade respiratória:',
    P351: 'Enxague cuidadosamente com água durante vários minutos.',
    P352: 'Lave com sabão e água.',
    P353: 'Lave a pele com água.',
    P360: 'Lave imediatamente a pele contaminada e a roupa com água.',
    P361: 'Retire imediatamente toda a roupa contaminada.',
    P362: 'Retire a roupa contaminada e lave-a antes de voltar a usá-la.',
    P363: 'Lave a roupa contaminada antes de voltar a usá-la.',
    P370: 'Em caso de incêndio:',
    P371: 'Em caso de incêndio importante e se for seguro fazê-lo:',
    P372: 'Risco de explosão.',
    P373: 'NÃO combata o incêndio quando o fogo alcança as explosões.',
    P374: 'Combate o incêndio de posição normal, a uma distância razoável.',
    P375: 'Combata o incêndio de uma posição protegida.',
    P376: 'Corte o fornecimento se for seguro fazê-lo.',
    P377: 'Incêndio de gás em fuga: não o combata se o gás não puder ser cortado.',
    P378: 'Utilize ... para extinguir.',
    P381: 'Em caso de fuga, elimine todas as fontes de ignição.',
    P391: 'Recolha o material derramado.',
    P403: 'Armazene em local bem ventilado.',
    P405: 'Armazene trancado.',
    P406: 'Armazene em recipiente resistente à corrosão.',
    P407: 'Mantenha um espaço livre de ar entre a tampa ou parede.',
    P410: 'Proteja da luz solar.',
    P411: 'Mantenha a temperatura inferior a ... °C.',
    P420: 'Armazene separadamente.',
    P422: 'Armazene o conteúdo em ...',
    P501: 'Elimine o conteúdo/recipiente em conformidade com a regulamentação local.',
    P502: 'Consulte informações específicas do fabricante/fornecedor.',
    P503: 'Consulte informações específicas do fabricante/fornecedor para procedimentos de reprocessamento/reutilização.',
    P210_P230: 'Mantenha afastado do calor.../Mantenha...humedecido com água.'
  };

  const SUBSTANCE_DB = {
    'acido nitrico': {
      name: 'Ácido Nítrico',
      synonyms: ['ácido nítrico', 'nitrato de hidrogenio', 'hno3', 'nitric acid'],
      un_number: '2031',
      proper_shipping_name: 'ÁCIDO NÍTRICO (exceto fumegante)',
      antt_class: ANTT.CLASS_8,
      antt_sub_risk: ANTT.CLASS_5_1,
      risk_number: '80',
      is_acid: true,
      is_strong_acid: true,
      is_oxidizer: true,
      is_corrosive: true,
      ghs_categories: [GHS_CATEGORIES.CORROSION_SKIN, GHS_CATEGORIES.CORROSION_EYE, GHS_CATEGORIES.OXIDIZING_LIQUID, GHS_CATEGORIES.ACUTE_TOXICITY_INHALATION],
      h_phrases: ['H272', 'H290', 'H314', 'H330', 'H335'],
      p_phrases: ['P210', 'P220', 'P260', 'P280', 'P301', 'P310', 'P305', 'P351', 'P310', 'P403', 'P405'],
      concentration: 68,
      density: 1.41
    },
    'acido sulfurico': {
      name: 'Ácido Sulfúrico',
      synonyms: ['ácido sulfúrico', 'sulfato de hidrogenio', 'h2so4', 'sulfuric acid', 'vitriolo'],
      un_number: '2796',
      proper_shipping_name: 'ÁCIDO SULFÚRICO',
      antt_class: ANTT.CLASS_8,
      risk_number: '80',
      is_acid: true,
      is_strong_acid: true,
      is_corrosive: true,
      ghs_categories: [GHS_CATEGORIES.CORROSION_SKIN, GHS_CATEGORIES.CORROSION_EYE, GHS_CATEGORIES.ACUTE_TOXICITY],
      h_phrases: ['H290', 'H314', 'H315', 'H319', 'H335'],
      p_phrases: ['P260', 'P280', 'P301', 'P330', 'P331', 'P303', 'P361', 'P353', 'P305', 'P351', 'P338', 'P310', 'P405', 'P501'],
      concentration: 98,
      density: 1.84
    },
    'acido cloridrico': {
      name: 'Ácido Clorídrico',
      synonyms: ['ácido clorídrico', 'cloridrico', 'muriatic acid', 'hcl', 'salmão'],
      un_number: '1789',
      proper_shipping_name: 'ÁCIDO CLORÍDRICO',
      antt_class: ANTT.CLASS_8,
      risk_number: '80',
      is_acid: true,
      is_strong_acid: true,
      is_corrosive: true,
      ghs_categories: [GHS_CATEGORIES.CORROSION_SKIN, GHS_CATEGORIES.CORROSION_EYE, GHS_CATEGORIES.ACUTE_TOXICITY_INHALATION],
      h_phrases: ['H290', 'H314', 'H315', 'H319', 'H335', 'H336'],
      p_phrases: ['P260', 'P280', 'P301', 'P330', 'P331', 'P303', 'P361', 'P353', 'P305', 'P351', 'P338', 'P310', 'P403', 'P405'],
      concentration: 37,
      density: 1.19
    },
    'hipoclorito de sodio': {
      name: 'Hipoclorito de Sódio',
      synonyms: ['hipoclorito', 'sodium hypochlorite', 'água sanitária', 'cloro', 'bleach', 'naocl'],
      un_number: '1791',
      proper_shipping_name: 'HIPOCLORITO DE SÓDIO',
      antt_class: ANTT.CLASS_8,
      risk_number: '80',
      is_hypochlorite: true,
      is_oxidizer: true,
      is_corrosive: true,
      is_base: false,
      is_strong_base: false,
      ghs_categories: [GHS_CATEGORIES.CORROSION_SKIN, GHS_CATEGORIES.CORROSION_EYE, GHS_CATEGORIES.OXIDIZING_LIQUID, GHS_CATEGORIES.AQUATIC_ACUTE],
      h_phrases: ['H290', 'H314', 'H315', 'H319', 'H335', 'H400'],
      p_phrases: ['P210', 'P220', 'P260', 'P280', 'P301', 'P330', 'P331', 'P303', 'P361', 'P353', 'P305', 'P351', 'P338', 'P310', 'P403', 'P405', 'P501'],
      concentration: 2.5,
      density: 1.11
    },
    'etanol': {
      name: 'Etanol',
      synonyms: ['álcool etílico', 'ethanol', 'ethyl alcohol', 'c2h5oh', 'álcool'],
      un_number: '1170',
      proper_shipping_name: 'ETANOL',
      antt_class: ANTT.CLASS_3,
      risk_number: '33',
      is_flammable: true,
      is_alcohol: true,
      is_organic: true,
      ghs_categories: [GHS_CATEGORIES.FLAMMABLE_LIQUID, GHS_CATEGORIES.HEALTH_HAZARD, GHS_CATEGORIES.EXCLAMATION_MARK],
      h_phrases: ['H225', 'H319', 'H336'],
      p_phrases: ['P210', 'P233', 'P240', 'P241', 'P242', 'P243', 'P280', 'P303', 'P361', 'P353', 'P370', 'P378', 'P403', 'P235', 'P501'],
      concentration: 96,
      density: 0.789
    },
    'acetona': {
      name: 'Acetona',
      synonyms: ['acetona', 'propanona', 'dimethyl ketone', 'aceton'],
      un_number: '1090',
      proper_shipping_name: 'ACETONA',
      antt_class: ANTT.CLASS_3,
      risk_number: '33',
      is_flammable: true,
      is_organic: true,
      is_ketone: true,
      ghs_categories: [GHS_CATEGORIES.FLAMMABLE_LIQUID, GHS_CATEGORIES.HEALTH_HAZARD, GHS_CATEGORIES.EXCLAMATION_MARK],
      h_phrases: ['H225', 'H319', 'H336'],
      p_phrases: ['P210', 'P233', 'P240', 'P241', 'P242', 'P243', 'P280', 'P303', 'P361', 'P353', 'P370', 'P378', 'P403', 'P235', 'P501'],
      concentration: 100,
      density: 0.79
    },
    'eter': {
      name: 'Éter Etílico',
      synonyms: ['éter', 'éter etílico', 'diethyl ether', 'ethoxyethane', 'ether'],
      un_number: '1155',
      proper_shipping_name: 'ÉTER DIETÍLICO',
      antt_class: ANTT.CLASS_3,
      antt_sub_risk: ANTT.CLASS_6_1,
      risk_number: '33',
      is_flammable: true,
      is_organic: true,
      is_ether: true,
      forms_peroxides: true,
      ghs_categories: [GHS_CATEGORIES.FLAMMABLE_LIQUID, GHS_CATEGORIES.HEALTH_HAZARD, GHS_CATEGORIES.EXCLAMATION_MARK],
      h_phrases: ['H225', 'H336', 'H302'],
      p_phrases: ['P210', 'P233', 'P240', 'P241', 'P242', 'P243', 'P280', 'P303', 'P361', 'P353', 'P370', 'P378', 'P403', 'P235', 'P501'],
      concentration: 100,
      density: 0.713
    },
    'peroxido de hidrogenio': {
      name: 'Peróxido de Hidrogênio',
      synonyms: ['água oxigenada', 'hydrogen peroxide', 'h2o2', 'peróxido'],
      un_number: '2014',
      proper_shipping_name: 'PERÓXIDO DE HIDROGÊNIO',
      antt_class: ANTT.CLASS_5_1,
      antt_sub_risk: ANTT.CLASS_8,
      risk_number: '50',
      is_oxidizer: true,
      is_peroxide: true,
      is_corrosive: true,
      ghs_categories: [GHS_CATEGORIES.OXIDIZING_LIQUID, GHS_CATEGORIES.CORROSION_SKIN, GHS_CATEGORIES.CORROSION_EYE],
      h_phrases: ['H272', 'H290', 'H314', 'H335', 'H336'],
      p_phrases: ['P210', 'P220', 'P221', 'P260', 'P280', 'P301', 'P330', 'P331', 'P303', 'P361', 'P353', 'P305', 'P351', 'P338', 'P310', 'P403', 'P405', 'P501'],
      concentration: 30,
      density: 1.11
    },
    'amonia': {
      name: 'Amônia',
      synonyms: ['amônia', 'amoníaco', 'ammonia', 'nh3', 'solução amoniacal'],
      un_number: '2672',
      proper_shipping_name: 'SOLUÇÃO AMONIACAL',
      antt_class: ANTT.CLASS_8,
      risk_number: '80',
      is_base: true,
      is_strong_base: true,
      is_corrosive: true,
      ghs_categories: [GHS_CATEGORIES.CORROSION_SKIN, GHS_CATEGORIES.CORROSION_EYE, GHS_CATEGORIES.ACUTE_TOXICITY_INHALATION],
      h_phrases: ['H290', 'H314', 'H315', 'H319', 'H335', 'H336'],
      p_phrases: ['P260', 'P280', 'P301', 'P330', 'P331', 'P303', 'P361', 'P353', 'P305', 'P351', 'P338', 'P310', 'P403', 'P405'],
      concentration: 28,
      density: 0.91
    },
    'hidroxido de sodio': {
      name: 'Hidróxido de Sódio',
      synonyms: ['soda cáustica', 'sodium hydroxide', 'naoh', 'hidróxido de sódio', 'caustic soda'],
      un_number: '1824',
      proper_shipping_name: 'SOLUÇÃO DE HIDRÓXIDO DE SÓDIO',
      antt_class: ANTT.CLASS_8,
      risk_number: '80',
      is_base: true,
      is_strong_base: true,
      is_corrosive: true,
      ghs_categories: [GHS_CATEGORIES.CORROSION_SKIN, GHS_CATEGORIES.CORROSION_EYE],
      h_phrases: ['H290', 'H314', 'H315', 'H319', 'H335'],
      p_phrases: ['P260', 'P280', 'P301', 'P330', 'P331', 'P303', 'P361', 'P353', 'P305', 'P351', 'P338', 'P310', 'P405'],
      concentration: 50,
      density: 1.53
    },
    'cianeto de sodio': {
      name: 'Cianeto de Sódio',
      synonyms: ['cianeto', 'sodium cyanide', 'nacn', 'cianureto', 'cianeto de sódio'],
      un_number: '1689',
      proper_shipping_name: 'CIANETO DE SÓDIO',
      antt_class: ANTT.CLASS_6_1,
      risk_number: '60',
      is_cyanide: true,
      is_toxic: true,
      ghs_categories: [GHS_CATEGORIES.ACUTE_TOXICITY, GHS_CATEGORIES.ACUTE_TOXICITY_INHALATION, GHS_CATEGORIES.CORROSION_SKIN],
      h_phrases: ['H300', 'H310', 'H330', 'H315', 'H318', 'H400', 'H410'],
      p_phrases: ['P260', 'P264', 'P270', 'P280', 'P301', 'P310', 'P302', 'P352', 'P310', 'P304', 'P340', 'P310', 'P403', 'P233', 'P405', 'P501'],
      concentration: 100,
      density: 1.6
    },
    'sulfeto de sodio': {
      name: 'Sulfeto de Sódio',
      synonyms: ['sulfeto', 'sodium sulfide', 'na2s', 'sulfeto de sódio', 'sulfureto'],
      un_number: '1385',
      proper_shipping_name: 'SULFETO DE SÓDIO, ANIDRO',
      antt_class: ANTT.CLASS_4_2,
      antt_sub_risk: ANTT.CLASS_6_1,
      risk_number: '42',
      is_sulfide: true,
      is_toxic: true,
      is_spontaneously_combustible: true,
      ghs_categories: [GHS_CATEGORIES.ACUTE_TOXICITY_INHALATION, GHS_CATEGORIES.CORROSION_SKIN, GHS_CATEGORIES.HEALTH_HAZARD],
      h_phrases: ['H301', 'H311', 'H314', 'H331', 'H400'],
      p_phrases: ['P210', 'P260', 'P264', 'P270', 'P280', 'P301', 'P310', 'P302', 'P352', 'P304', 'P340', 'P310', 'P403', 'P233', 'P405', 'P501'],
      concentration: 100,
      density: 1.86
    },
    'metanol': {
      name: 'Metanol',
      synonyms: ['álcool metílico', 'methanol', 'methyl alcohol', 'ch3oh', 'metanol'],
      un_number: '1230',
      proper_shipping_name: 'METANOL',
      antt_class: ANTT.CLASS_3,
      antt_sub_risk: ANTT.CLASS_6_1,
      risk_number: '33',
      is_flammable: true,
      is_alcohol: true,
      is_organic: true,
      is_toxic: true,
      ghs_categories: [GHS_CATEGORIES.FLAMMABLE_LIQUID, GHS_CATEGORIES.ACUTE_TOXICITY, GHS_CATEGORIES.SPECIFIC_TARGET_ORGAN],
      h_phrases: ['H225', 'H301', 'H311', 'H331', 'H370'],
      p_phrases: ['P210', 'P233', 'P240', 'P241', 'P242', 'P243', 'P260', 'P280', 'P303', 'P361', 'P353', 'P304', 'P340', 'P310', 'P370', 'P378', 'P403', 'P235', 'P501'],
      concentration: 100,
      density: 0.792
    },
    'benzeno': {
      name: 'Benzeno',
      synonyms: ['benzol', 'benzene', 'c6h6'],
      un_number: '1114',
      proper_shipping_name: 'BENZENO',
      antt_class: ANTT.CLASS_3,
      risk_number: '33',
      is_flammable: true,
      is_organic: true,
      is_toxic: true,
      is_carcinogen: true,
      ghs_categories: [GHS_CATEGORIES.FLAMMABLE_LIQUID, GHS_CATEGORIES.HEALTH_HAZARD, GHS_CATEGORIES.EXCLAMATION_MARK, GHS_CATEGORIES.AQUATIC_CHRONIC],
      h_phrases: ['H225', 'H304', 'H315', 'H319', 'H340', 'H350', 'H372', 'H412'],
      p_phrases: ['P210', 'P233', 'P240', 'P241', 'P242', 'P243', 'P260', 'P280', 'P303', 'P361', 'P353', 'P370', 'P378', 'P403', 'P235', 'P501'],
      concentration: 100,
      density: 0.876
    },
    'gasolina': {
      name: 'Gasolina',
      synonyms: ['gasolina', 'gasoline', 'petrol', 'nafta'],
      un_number: '1203',
      proper_shipping_name: 'GASOLINA',
      antt_class: ANTT.CLASS_3,
      risk_number: '33',
      is_flammable: true,
      is_organic: true,
      is_fuel: true,
      ghs_categories: [GHS_CATEGORIES.FLAMMABLE_LIQUID, GHS_CATEGORIES.HEALTH_HAZARD, GHS_CATEGORIES.EXCLAMATION_MARK, GHS_CATEGORIES.AQUATIC_CHRONIC],
      h_phrases: ['H225', 'H304', 'H315', 'H336', 'H361', 'H411'],
      p_phrases: ['P210', 'P233', 'P240', 'P241', 'P242', 'P243', 'P260', 'P280', 'P303', 'P361', 'P353', 'P370', 'P378', 'P403', 'P235', 'P501'],
      concentration: 100,
      density: 0.75
    },
    'acido acetico': {
      name: 'Ácido Acético',
      synonyms: ['ácido acético', 'ácido etanoico', 'acetic acid', 'vinegar acid', 'ch3cooh'],
      un_number: '2789',
      proper_shipping_name: 'ÁCIDO ACÉTICO GLACIAL',
      antt_class: ANTT.CLASS_8,
      risk_number: '80',
      is_acid: true,
      is_organic: true,
      is_corrosive: true,
      is_flammable: true,
      ghs_categories: [GHS_CATEGORIES.CORROSION_SKIN, GHS_CATEGORIES.CORROSION_EYE, GHS_CATEGORIES.FLAMMABLE_LIQUID, GHS_CATEGORIES.EXCLAMATION_MARK],
      h_phrases: ['H226', 'H314', 'H318', 'H336'],
      p_phrases: ['P210', 'P260', 'P280', 'P301', 'P330', 'P331', 'P303', 'P361', 'P353', 'P305', 'P351', 'P338', 'P310', 'P403', 'P235', 'P405'],
      concentration: 100,
      density: 1.05
    }
  };

  const INCOMPATIBILITY_RULES = [
    {
      id: 'acid_hypochlorite',
      name: 'Ácidos + Hipocloritos -> Gás Cloro',
      condition: (s) => s.some(x => x.is_acid) && s.some(x => x.is_hypochlorite),
      severity: 'CRITICAL',
      reaction: 'Liberação de gás cloro (Cl₂) tóxico, asfixiante e corrosivo.',
      gas: 'Cloro (Cl₂)',
      h_gas: ['H270', 'H330', 'H315', 'H319', 'H335'],
      trigger: (items) => items.filter(i => i.is_acid || i.is_hypochlorite),
      antt_override: ANTT.CLASS_2_3
    },
    {
      id: 'acid_cyanide',
      name: 'Ácidos + Cianetos -> Gás Cianídrico',
      condition: (s) => s.some(x => x.is_acid) && s.some(x => x.is_cyanide),
      severity: 'CRITICAL',
      reaction: 'Liberação de ácido cianídrico (HCN), gás extremamente tóxico e rápido.',
      gas: 'Cianídrico (HCN)',
      h_gas: ['H300', 'H310', 'H330', 'H370', 'H372'],
      trigger: (items) => items.filter(i => i.is_acid || i.is_cyanide),
      antt_override: ANTT.CLASS_2_3
    },
    {
      id: 'acid_sulfide',
      name: 'Ácidos + Sulfetos -> Gás Sulfídrico',
      condition: (s) => s.some(x => x.is_acid) && s.some(x => x.is_sulfide),
      severity: 'CRITICAL',
      reaction: 'Liberação de sulfeto de hidrogênio (H₂S), gás tóxico, asfixiante e de odor característico.',
      gas: 'Sulfídrico (H₂S)',
      h_gas: ['H330', 'H335', 'H400', 'H310'],
      trigger: (items) => items.filter(i => i.is_acid || i.is_sulfide),
      antt_override: ANTT.CLASS_2_3
    },
    {
      id: 'acid_strong_base',
      name: 'Ácidos + Bases Fortes -> Reação Exotérmica Violenta',
      condition: (s) => s.some(x => x.is_strong_acid) && s.some(x => x.is_strong_base),
      severity: 'HIGH',
      reaction: 'Neutralização exotérmica violenta com salpicos, vaporização e risco de projeção.',
      gas: 'Vapor/aerosol corrosivo',
      h_gas: ['H314', 'H335'],
      trigger: (items) => items.filter(i => i.is_strong_acid || i.is_strong_base),
      antt_override: null
    },
    {
      id: 'oxidizer_flammable',
      name: 'Oxidantes + Inflamáveis -> Ignição/Explosão',
      condition: (s) => s.some(x => x.is_oxidizer) && s.some(x => x.is_flammable),
      severity: 'CRITICAL',
      reaction: 'Risco de ignição espontânea, combustão intensificada ou explosão.',
      gas: 'Fumaça oxidante/tóxica',
      h_gas: ['H270', 'H272', 'H330'],
      trigger: (items) => items.filter(i => i.is_oxidizer || i.is_flammable),
      antt_override: ANTT.CLASS_5_1
    },
    {
      id: 'nitric_acid_alcohol_organic',
      name: 'Ácido Nítrico + Álcool/Orgânicos -> Reação Violenta/Gases Nitrosos',
      condition: (s) => s.some(x => x.is_strong_acid && x.is_oxidizer) && s.some(x => x.is_alcohol || x.is_organic),
      severity: 'CRITICAL',
      reaction: 'Reação violenta, possível ignição e liberação de gases nitrosos (NOx) tóxicos.',
      gas: 'Óxidos de nitrogênio (NOx)',
      h_gas: ['H330', 'H335', 'H370', 'H372'],
      trigger: (items) => items.filter(i => (i.is_strong_acid && i.is_oxidizer) || (i.is_alcohol || i.is_organic)),
      antt_override: ANTT.CLASS_5_1
    },
    {
      id: 'peroxide_metal_reducer',
      name: 'Peróxidos + Metais/Redutores -> Decomposição Acelerada',
      condition: (s) => s.some(x => x.is_peroxide) && s.some(x => x.is_metal || x.is_reducer),
      severity: 'HIGH',
      reaction: 'Decomposição acelerada, liberação de oxigênio e risco de incêndio/explosão.',
      gas: 'Oxigênio (O₂)',
      h_gas: ['H272', 'H330'],
      trigger: (items) => items.filter(i => i.is_peroxide || i.is_metal || i.is_reducer),
      antt_override: ANTT.CLASS_5_2
    },
    {
      id: 'ammonia_hypochlorite',
      name: 'Amônia + Hipoclorito -> Cloraminas Tóxicas',
      condition: (s) => s.some(x => x.is_base && x.name.toLowerCase().includes('amônia')) && s.some(x => x.is_hypochlorite),
      severity: 'CRITICAL',
      reaction: 'Formação de cloraminas (mono-, di-, tricloramina) tóxicas e irritantes.',
      gas: 'Cloraminas',
      h_gas: ['H330', 'H335', 'H315', 'H319', 'H370'],
      trigger: (items) => items.filter(i => (i.is_base && i.name.toLowerCase().includes('amônia')) || i.is_hypochlorite),
      antt_override: ANTT.CLASS_2_3
    }
  ];

  function normalizeName(name) {
    return String(name || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function findSubstance(name) {
    const norm = normalizeName(name);
    for (const key of Object.keys(SUBSTANCE_DB)) {
      const s = SUBSTANCE_DB[key];
      if (norm.includes(key) || s.synonyms.some(syn => norm.includes(syn))) return s;
      const firstName = s.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (norm.includes(firstName)) return s;
    }
    return null;
  }

  const normalized = substances.map(item => {
    const name = item.name || item;
    const found = findSubstance(name);
    return {
      input: name,
      found: !!found,
      data: found,
      fraction: Number(item.fraction || item.percent || 0) || 0,
      mass_kg: Number(item.mass_kg || 0) || 0,
      volume_l: Number(item.volume_l || 0) || 0
    };
  }).filter(item => item.found);

  if (normalized.length === 0) {
    return res.status(200).json({
      un_number: 'UN0000',
      proper_shipping_name: 'Mistura Não Classificada / Subsâncias Desconhecidas',
      risk_class: 'Não classificável',
      risk_number: '00',
      pictograms: ['GHS07'],
      h_phrases: ['H303'],
      p_phrases: ['P101', 'P102', 'P103'],
      safety_alert: 'Nenhuma substância reconhecida foi fornecida. Não é possível realizar a classificação de segurança química.',
      _debug: {
        input: substances,
        recognized: [],
        total_fraction: 0,
        corrosion_fraction: 0,
        acute_toxicity_fraction: 0,
        incompatibilities: [],
        dominant_substance: null,
        notes: 'Nenhum componente reconhecido na base de dados.'
      }
    });
  }

  const totalFraction = normalized.reduce((sum, n) => sum + n.fraction, 0) || 1;
  const enriched = normalized.map(n => ({
    ...n.data,
    fraction: n.fraction,
    normalized_fraction: n.fraction / totalFraction,
    input: n.input
  }));

  const corrosionFraction = enriched.reduce((sum, s) => {
    if (s.ghs_categories.includes(GHS_CATEGORIES.CORROSION_SKIN)) return sum + s.normalized_fraction;
    return sum;
  }, 0);

  const acuteToxicityFraction = enriched.reduce((sum, s) => {
    if (s.ghs_categories.includes(GHS_CATEGORIES.ACUTE_TOXICITY) || s.ghs_categories.includes(GHS_CATEGORIES.ACUTE_TOXICITY_INHALATION)) return sum + s.normalized_fraction;
    return sum;
  }, 0);

  const detectedIncompatibilities = [];
  for (const rule of INCOMPATIBILITY_RULES) {
    if (rule.condition(enriched)) {
      detectedIncompatibilities.push({
        id: rule.id,
        name: rule.name,
        severity: rule.severity,
        reaction: rule.reaction,
        gas: rule.gas,
        h_gas: rule.h_gas,
        trigger: rule.trigger(enriched).map(s => s.name),
        antt_override: rule.antt_override
      });
    }
  }

  const dominant = enriched.reduce((max, s) => s.normalized_fraction > max.normalized_fraction ? s : max, enriched[0]);

  let finalAntt = dominant.antt_class;
  let subRisk = dominant.antt_sub_risk || null;
  let riskNumber = dominant.risk_number;
  let properShippingName = dominant.proper_shipping_name;
  let unNumber = dominant.un_number;

  const hasCritical = detectedIncompatibilities.some(i => i.severity === 'CRITICAL');
  const hasHigh = detectedIncompatibilities.some(i => i.severity === 'HIGH');

  if (detectedIncompatibilities.length > 0) {
    const overrides = detectedIncompatibilities
      .map(i => i.antt_override)
      .filter(Boolean);
    if (overrides.length > 0) {
      finalAntt = overrides.reduce((max, c) => Number(c.risk_number) > Number(max.risk_number) ? c : max, overrides[0]);
      riskNumber = finalAntt.risk_number;
      properShippingName = `MISTURA PERIGOSA (base: ${dominant.proper_shipping_name})`;
      unNumber = 'UN0000';
    }
  }

  if (hasCritical) {
    subRisk = subRisk || ANTT.CLASS_2_3;
  }

  if (hasHigh || hasCritical) {
    riskNumber = finalAntt.risk_number;
  }

  const allGhsCategories = new Set();
  const allHPhrases = new Set();
  const allPPhrases = new Set();

  for (const s of enriched) {
    s.ghs_categories.forEach(c => allGhsCategories.add(c));
    s.h_phrases.forEach(h => allHPhrases.add(h));
    s.p_phrases.forEach(p => allPPhrases.add(p));
  }

  if (corrosionFraction >= 0.5) {
    allGhsCategories.add(GHS_CATEGORIES.CORROSION_SKIN);
    allHPhrases.add('H314');
    allPPhrases.add('P280');
    allPPhrases.add('P310');
  } else if (corrosionFraction >= 0.1) {
    allGhsCategories.add(GHS_CATEGORIES.CORROSION_SKIN);
    allHPhrases.add('H315');
  }

  if (acuteToxicityFraction >= 0.5) {
    allGhsCategories.add(GHS_CATEGORIES.ACUTE_TOXICITY_INHALATION);
    allHPhrases.add('H330');
    allPPhrases.add('P310');
  } else if (acuteToxicityFraction >= 0.1) {
    allGhsCategories.add(GHS_CATEGORIES.ACUTE_TOXICITY);
    allHPhrases.add('H302');
  }

  for (const inc of detectedIncompatibilities) {
    if (inc.id === 'acid_hypochlorite') allGhsCategories.add(GHS_CATEGORIES.ACUTE_TOXICITY_INHALATION);
    if (inc.id === 'oxidizer_flammable') allGhsCategories.add(GHS_CATEGORIES.OXIDIZING_LIQUID);
    if (inc.id === 'nitric_acid_alcohol_organic') allGhsCategories.add(GHS_CATEGORIES.OXIDIZING_LIQUID);
    if (inc.id === 'peroxide_metal_reducer') allGhsCategories.add(GHS_CATEGORIES.ORGANIC_PEROXIDE);
    inc.h_gas.forEach(h => allHPhrases.add(h));
  }

  const selectedPictograms = new Set();
  if (allGhsCategories.has(GHS_CATEGORIES.EXPLOSIVE)) selectedPictograms.add('GHS01');
  if (allGhsCategories.has(GHS_CATEGORIES.FLAMMABLE_LIQUID) || allGhsCategories.has(GHS_CATEGORIES.ORGANIC_PEROXIDE)) selectedPictograms.add('GHS02');
  if (allGhsCategories.has(GHS_CATEGORIES.OXIDIZING_LIQUID)) selectedPictograms.add('GHS03');
  if (allGhsCategories.has(GHS_CATEGORIES.GAS_UNDER_PRESSURE) || allGhsCategories.has(GHS_CATEGORIES.COMPRESSED_GAS)) selectedPictograms.add('GHS04');
  if (allGhsCategories.has(GHS_CATEGORIES.CORROSION_SKIN) || allGhsCategories.has(GHS_CATEGORIES.CORROSION_EYE)) selectedPictograms.add('GHS05');
  if (allGhsCategories.has(GHS_CATEGORIES.ACUTE_TOXICITY_INHALATION)) selectedPictograms.add('GHS06');
  if (allGhsCategories.has(GHS_CATEGORIES.EXCLAMATION_MARK) || allGhsCategories.has(GHS_CATEGORIES.HEALTH_HAZARD) || allGhsCategories.has(GHS_CATEGORIES.ACUTE_TOXICITY)) selectedPictograms.add('GHS07');
  if (allGhsCategories.has(GHS_CATEGORIES.SPECIFIC_TARGET_ORGAN) || allGhsCategories.has(GHS_CATEGORIES.HEALTH_HAZARD)) selectedPictograms.add('GHS08');
  if (allGhsCategories.has(GHS_CATEGORIES.AQUATIC_ACUTE) || allGhsCategories.has(GHS_CATEGORIES.AQUATIC_CHRONIC)) selectedPictograms.add('GHS09');

  if (selectedPictograms.size === 0) selectedPictograms.add('GHS07');

  const safetyAlert = detectedIncompatibilities.length > 0
    ? detectedIncompatibilities.map(i => `[${i.severity}] ${i.name}: ${i.reaction} Gás formado: ${i.gas}. Evite a mistura; use EPI completo; ventilação e escape adequados; consulte FISPQ.`).join(' | ')
    : 'Nenhuma incompatibilidade química crítica detectada entre os componentes informados. Mantenha as precauções padrão de laboratório e manipule com EPI adequado.';

  const hPhrasesResolved = Array.from(allHPhrases)
    .filter(h => H_PHRASES[h])
    .map(h => ({ code: h, text: H_PHRASES[h] }));

  const pPhrasesResolved = Array.from(allPPhrases)
    .filter(p => P_PHRASES[p])
    .map(p => ({ code: p, text: P_PHRASES[p] }));

  const hCodes = hPhrasesResolved.map(h => h.code);
  const pCodes = pPhrasesResolved.map(p => p.code);

  const debug = {
    input: substances,
    recognized: enriched.map(s => ({ name: s.name, fraction: s.fraction, normalized_fraction: s.normalized_fraction })),
    total_fraction: totalFraction,
    corrosion_fraction: corrosionFraction,
    acute_toxicity_fraction: acuteToxicityFraction,
    incompatibilities: detectedIncompatibilities,
    dominant_substance: {
      name: dominant.name,
      fraction: dominant.normalized_fraction,
      original_un: dominant.un_number,
      original_class: dominant.antt_class
    },
    final_class: finalAntt,
    final_sub_risk: subRisk,
    applied_ghs_categories: Array.from(allGhsCategories),
    selected_pictograms: Array.from(selectedPictograms),
    notes: 'Classificação baseada em aditividade de frações GHS e matriz de incompatibilidade.'
  };

  return res.status(200).json({
    un_number: unNumber,
    proper_shipping_name: properShippingName,
    risk_class: `${finalAntt.name} (Classe ${finalAntt.class_code})`,
    risk_number: riskNumber,
    sub_risk: subRisk ? `${subRisk.name} (Classe ${subRisk.class_code})` : null,
    pictograms: Array.from(selectedPictograms),
    h_phrases: hCodes,
    p_phrases: pCodes,
    safety_alert: safetyAlert,
    details: {
      h_phrases_texts: hPhrasesResolved,
      p_phrases_texts: pPhrasesResolved,
      recognized_substances: enriched.map(s => s.name),
      incompatibilities: detectedIncompatibilities.map(i => ({ id: i.id, name: i.name, severity: i.severity, gas: i.gas, reaction: i.reaction }))
    },
    _debug: debug
  });
};
