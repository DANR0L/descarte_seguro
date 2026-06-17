const ACIDO_BUTIRICO = 'Ácido Butírico';
const ACIDO_VALERICO = 'Ácido Valérico';
const ORGANIC_FAMILIES = ['ácido carboxílico', 'ácido graxo', 'ácido orgânico', 'álcool', 'aldeído', 'cetona', 'éster', 'éter', 'amina', 'amida', 'nitrilo', 'haleto orgânico', 'sulfona', 'mercaptana'];
const INORGANIC_FAMILIES = ['ácido inorgânico', 'ácido mineral', 'sal inorgânico', 'base inorgânica', 'óxido', 'peróxido', 'haleto inorgânico', 'metal'];

const UN_CODES = {
  CORROSIVE_LIQUID_ACID_ORGANIC_N_O_S: '3265',
  CORROSIVE_LIQUID_ACID_INORGANIC_N_O_S: '3264',
  TOXIC_LIQUID_CORROSIVE_ORGANIC_N_O_S: '2927',
  FLAMMABLE_LIQUID_CORROSIVE_N_O_S: '2924',
  CORROSIVE_LIQUID_N_O_S: '1760',
  ENVIRONMENTALLY_HAZARDOUS_SUBSTANCE_LIQUID: '3082',
};

const PICTOGRAMS = {
  GHS05: 'GHS05',
  GHS07: 'GHS07',
  GHS06: 'GHS06',
  GHS02: 'GHS02',
};

function detectChemicalFamily(compoundName) {
  const normalized = compoundName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const organicByName = normalized.includes('acido butirico') || normalized.includes('acido valerico') || normalized.includes('acido propionico') || normalized.includes('acido caproico') || normalized.includes('acido caprilico') || normalized.includes('acido laurico') || normalized.includes('acido miristico') || normalized.includes('acido palmitico') || normalized.includes('acido estearico') || normalized.includes('acido oleico') || normalized.includes('acido linoleico') || normalized.includes('acido acetico') || normalized.includes('acido formico') || normalized.includes('acido citrico') || normalized.includes('acido lactico') || normalized.includes('acido latico') || normalized.includes('acido oxalico') || normalized.includes('acido tartarico') || normalized.includes('acido malico') || normalized.includes('acido succinico') || normalized.includes('acido benzoico') || normalized.includes('acido salicilico') || normalized.includes('acido fumarico') || normalized.includes('acido adipico') || normalized.includes('acido glutarico') || normalized.includes('acido pimelico') || normalized.includes('acido suberico') || normalized.includes('acido azelaico') || normalized.includes('acido sebacico') || normalized.includes('acido dodecanico') || normalized.includes('acido tetradecanoico') || normalized.includes('acido hexadecanoico') || normalized.includes('acido octadecanoico') || normalized.includes('acido metanoico') || normalized.includes('acido etanoico') || normalized.includes('acido propanoico') || normalized.includes('acido butanoico') || normalized.includes('acido pentanoico') || normalized.includes('acido hexanoico') || normalized.includes('acido heptanoico') || normalized.includes('acido octanoico') || normalized.includes('acido nonanoico') || normalized.includes('acido decanoico') || normalized.includes('acido undecanoico') || normalized.includes('acido tridecanoico') || normalized.includes('acido pentadecanoico') || normalized.includes('acido heptadecanoico') || normalized.includes('acido nonadecanoico') || normalized.includes('acido eicosanoico') || normalized.includes('acido docosanoico') || normalized.includes('acido tetracosanoico') || normalized.includes('acido hexacosanoico') || normalized.includes('acido octacosanoico') || normalized.includes('acido triacontanoico') || normalized.includes('acido erucico') || normalized.includes('acido nervonico') || normalized.includes('acido linolenico') || normalized.includes('acido araquidonico') || normalized.includes('acido eicosapentaenoico') || normalized.includes('acido docosahexaenoico') || normalized.includes('acido gama-linolenico') || normalized.includes('acido di-hidroxiestearico') || normalized.includes('acido ricinoleico') || normalized.includes('acido treonico') || normalized.includes('acido xilónico') || normalized.includes('acido galacturonico') || normalized.includes('acido glucuronico') || normalized.includes('acido mannuronico') || normalized.includes('acido glicolico') || normalized.includes('acido glicirrico') || normalized.includes('acido quenodesoxicólico') || normalized.includes('acido quodesoxicolico') || normalized.includes('acido desoxicolico') || normalized.includes('acido colico') || normalized.includes('acido taurocólico') || normalized.includes('acido glicocólico') || normalized.includes('acido úrico') || normalized.includes('acido urico') || normalized.includes('acido hipúrico') || normalized.includes('acido hipurico') || normalized.includes('acido mandélico') || normalized.includes('acido mandelico') || normalized.includes('acido fenilacetico') || normalized.includes('acido cianídrico') || normalized.includes('acido cianidrico') || normalized.includes('acido tioglicolico') || normalized.includes('acido mercaptoacetico') || normalized.includes('acido lactobionico') || normalized.includes('acido glucoheptonico') || normalized.includes('acido galactico') || normalized.includes('acido mucico') || normalized.includes('acido sacarico') || normalized.includes('acido isoascorbico') || normalized.includes('acido ascorbico') || normalized.includes('acido eritórbico') || normalized.includes('acido eritorbico') || normalized.includes('acido nicotinico') || normalized.includes('acido isonicotinico') || normalized.includes('acido picolinico') || normalized.includes('acido piridoxic') || normalized.includes('acido pantotenico') || normalized.includes('acido folico') || normalized.includes('acido pteroilglutamico') || normalized.includes('acido aminobenzoico') || normalized.includes('acido antranilico') || normalized.includes('acido sulfanilico') || normalized.includes('acido sulfamico') || normalized.includes('acido toluenossulfonico') || normalized.includes('acido xilenosulfonico') || normalized.includes('acido dodecilbenzenossulfonico') || normalized.includes('acido alquilbenzenossulfonico') || normalized.includes('acido naftaleno') || normalized.includes('acido naftalenosulfonico') || normalized.includes('acido hidroxinaftoico') || normalized.includes('acido naftaleno') || normalized.includes('acido ftalico') || normalized.includes('acido isoftalico') || normalized.includes('acido tereftalico') || normalized.includes('acido trimelitico') || normalized.includes('acido piromelitico') || normalized.includes('acido hemimelitico') || normalized.includes('acido benzenopentacarboxilico') || normalized.includes('acido benzenohexacarboxilico') || normalized.includes('acido mellitico') || normalized.includes('acido trimesico') || normalized.includes('acido galico') || normalized.includes('acido elágico') || normalized.includes('acido elagico') || normalized.includes('acido cafeico') || normalized.includes('acido clorogênico') || normalized.includes('acido clorogenico') || normalized.includes('acido ferúlico') || normalized.includes('acido ferulico') || normalized.includes('acido p-cumarico') || normalized.includes('acido cumarico') || normalized.includes('acido sinapico') || normalized.includes('acido syringico') || normalized.includes('acido vanílico') || normalized.includes('acido vanilico') || normalized.includes('acido protocatequico') || normalized.includes('acido hidroxibenzoico') || normalized.includes('acido nitrobenzoico') || normalized.includes('acido clorobenzoico') || normalized.includes('acido bromobenzoico') || normalized.includes('acido iodobenzoico') || normalized.includes('acido fluorobenzoico') || normalized.includes('acido aminobenzoico') || normalized.includes('acido difenilacetico') || normalized.includes('acido trifenilacetico') || normalized.includes('acido cinamico') || normalized.includes('acido sorbico') || normalized.includes('acido benzoico') || normalized.includes('acido salicilico') || normalized.includes('acido acetilsalicilico') || normalized.includes('acido p-amino') || normalized.includes('acido meso') || normalized.includes('acido tartarico') || normalized.includes('acido malico') || normalized.includes('acido succinico') || normalized.includes('acido glutarico') || normalized.includes('acido adipico') || normalized.includes('acido pimelico') || normalized.includes('acido suberico') || normalized.includes('acido azelaico') || normalized.includes('acido sebacico') || normalized.includes('acido maleico') || normalized.includes('acido fumarico') || normalized.includes('acido itaconico') || normalized.includes('acido citracônico') || normalized.includes('acido citraconico') || normalized.includes('acido mesacônico') || normalized.includes('acido mesaconico') || normalized.includes('acido aconitico') || normalized.includes('acido tricarbálico') || normalized.includes('acido tricarbálico') || normalized.includes('acido propanetricarboxilico') || normalized.includes('acido butanotetracarboxilico') || normalized.includes('acido etilenodiaminotetracético') || normalized.includes('acido edta') || normalized.includes('acido etilenodiaminotetracetico') || normalized.includes('acido nitrilotriacetico') || normalized.includes('acido iminodiacetico') || normalized.includes('acido diglicolico') || normalized.includes('acido tiodiacetico') || normalized.includes('acido mercaptosuccinico') || normalized.includes('acido tiossalicilico') || normalized.includes('acido ditiocarbamico') || normalized.includes('acido xantato') || normalized.includes('acido ditiocianato') || normalized.includes('acido tritiocarbonico') || normalized.includes('acido peracetico') || normalized.includes('acido peroxibenzoico') || normalized.includes('acido peroxiacetico') || normalized.includes('acido m-cloroperbenzoico') || normalized.includes('acido peroxi') || normalized.includes('acido permanganico') || normalized.includes('acido dicloroacetico') || normalized.includes('acido tricloroacetico') || normalized.includes('acido tetracloroacetico') || normalized.includes('acido cloroacetico') || normalized.includes('acido bromoacetico') || normalized.includes('acido iodoacetico') || normalized.includes('acido fluoroacetico') || normalized.includes('acido trifluoroacetico') || normalized.includes('acido difluoroacetico') || normalized.includes('acido monofluoroacetico') || normalized.includes('acido clorofluoroacetico') || normalized.includes('acido bromofluoroacetico') || normalized.includes('acido iodofluoroacetico') || normalized.includes('acido diclorofluoroacetico') || normalized.includes('acido triclorofluoroacetico') || normalized.includes('acido dibromoacetico') || normalized.includes('acido tribromoacetico') || normalized.includes('acido clorobromoacetico') || normalized.includes('acido diclorobromoacetico') || normalized.includes('acido clorodibromoacetico') || normalized.includes('acido bromoiodoacetico') || normalized.includes('acido cloroiodoacetico') || normalized.includes('acido fluorobromoacetico') || normalized.includes('acido fluorocloroacetico') || normalized.includes('acido nitroacetico') || normalized.includes('acido aminoacetico') || normalized.includes('acido glicina') || normalized.includes('acido acetamido') || normalized.includes('acido hidroxiacetico') || normalized.includes('acido metoxiacetico') || normalized.includes('acido etoxiacetico') || normalized.includes('acido propoxiacetico') || normalized.includes('acido butoxiacetico') || normalized.includes('acido fenoxiacetico') || normalized.includes('acido 2,4-diclorofenoxiacetico') || normalized.includes('acido 2,4,5-triclorofenoxiacetico') || normalized.includes('acido 2,4-d') || normalized.includes('acido mecoprop') || normalized.includes('acido dicamba') || normalized.includes('acido piqueram') || normalized.includes('acido indolbutirico') || normalized.includes('acido naftalenoacetico') || normalized.includes('acido abscisico') || normalized.includes('acido giberélico') || normalized.includes('acido giberelico') || normalized.includes('acido jasmônico') || normalized.includes('acido jasmonico') || normalized.includes('acido brassinolideo') || normalized.includes('acido salicilico') || normalized.includes('acido acido');
  const inorganicByName = normalized.includes('acido sulfurico') || normalized.includes('acido cloridrico') || normalized.includes('acido nitrico') || normalized.includes('acido fosforico') || normalized.includes('acido fluoridrico') || normalized.includes('acido bromidrico') || normalized.includes('acido iodidrico') || normalized.includes('acido perclorico') || normalized.includes('acido clorico') || normalized.includes('acido cloroso') || normalized.includes('acido hipocloroso') || normalized.includes('acido hipobromoso') || normalized.includes('acido bromico') || normalized.includes('acido bromoso') || normalized.includes('acido yodico') || normalized.includes('acido iodico') || normalized.includes('acido iodoso') || normalized.includes('acido nitroso') || normalized.includes('acido hiponitroso') || normalized.includes('acido fosforoso') || normalized.includes('acido hipofosforoso') || normalized.includes('acido borico') || normalized.includes('acido boracico') || normalized.includes('acido cianidrico') || normalized.includes('acido cianidrico') || normalized.includes('acido cianhidrico') || normalized.includes('acido selenico') || normalized.includes('acido selenoso') || normalized.includes('acido telurico') || normalized.includes('acido telurioso') || normalized.includes('acido cromico') || normalized.includes('acido dicromico') || normalized.includes('acido molibdenico') || normalized.includes('acido tungstico') || normalized.includes('acido vanadico') || normalized.includes('acido niobico') || normalized.includes('acido tantalico') || normalized.includes('acido arsenico') || normalized.includes('acido arsenioso') || normalized.includes('acido antimonico') || normalized.includes('acido antimonioso') || normalized.includes('acido estanico') || normalized.includes('acido estanhoso') || normalized.includes('acido plumbico') || normalized.includes('acido plumboso') || normalized.includes('acido manganesico') || normalized.includes('acido manganoso') || normalized.includes('acido permanganico') || normalized.includes('acido ferricianidrico') || normalized.includes('acido ferrocianidrico') || normalized.includes('acido tiossulfurico') || normalized.includes('acido ditionico') || normalized.includes('acido pirossulfurico') || normalized.includes('acido sulfuroso') || normalized.includes('acido sulfidrico') || normalized.includes('acido polissulfidrico') || normalized.includes('acido carbamico') || normalized.includes('acido carbonico') || normalized.includes('acido xantico') || normalized.includes('acido tiossianico') || normalized.includes('acido rodanico') || normalized.includes('acido hipossulfuroso') || normalized.includes('acido nitrosilissulfurico') || normalized.includes('acido silicico') || normalized.includes('acido fluossilicico') || normalized.includes('acido fluorossilicico') || normalized.includes('acido fluoroborico') || normalized.includes('acido hexafluorofosforico') || normalized.includes('acido clorossulfonico') || normalized.includes('acido fluorossulfonico') || normalized.includes('acido amidosulfonico') || normalized.includes('acido sulfamico') || normalized.includes('acido sulfanilico') || normalized.includes('acido nitrosulfonico') || normalized.includes('acido nitrosil') || normalized.includes('acido cianossulfonico') || normalized.includes('acido tiocianico') || normalized.includes('acido isotiocianico') || normalized.includes('acido nitromuriatico') || normalized.includes('acido regia') || normalized.includes('acido clorossulfurico') || normalized.includes('acido fluorossulfurico') || normalized.includes('acido bromossulfurico') || normalized.includes('acido iodossulfurico') || normalized.includes('acido seleniossulfurico') || normalized.includes('acido tellurossulfurico') || normalized.includes('acido cianico') || normalized.includes('acido isocianico') || normalized.includes('acido fulminico') || normalized.includes('acido hidrazoico') || normalized.includes('acido azotidrico') || normalized.includes('acido azotico') || normalized.includes('acido muriatico') || normalized.includes('acido hidroclorico') || normalized.includes('acido sulfurico fumegante') || normalized.includes('acido oleum') || normalized.includes('acido nitrico fumegante') || normalized.includes('acido nitrico concentrado') || normalized.includes('acido nitrico red fuming') || normalized.includes('acido nitrico white fuming') || normalized.includes('acido anidrico') || normalized.includes('acido ortofosforico') || normalized.includes('acido metafosforico') || normalized.includes('acido pirofosforico') || normalized.includes('acido polifosforico') || normalized.includes('acido fosforico') || normalized.includes('acido fosfinico') || normalized.includes('acido fosfonico') || normalized.includes('acido fosforico') || normalized.includes('acido hipo') || normalized.includes('acido perborico') || normalized.includes('acido percarbonico') || normalized.includes('acido persulfurico') || normalized.includes('acido peroxodisulfurico') || normalized.includes('acido peroxomonossulfurico') || normalized.includes('acido oxalico') || normalized.includes('acido oxalico') || normalized.includes('acido cianhidrico') || normalized.includes('acido prussico') || normalized.includes('acido hydrocianico') || normalized.includes('acido nitro-hidroclorico') || normalized.includes('acido clorossulfonico') || normalized.includes('acido fluorossulfonico') || normalized.includes('acido clorossulfurico') || normalized.includes('acido fluorossulfurico') || normalized.includes('acido bromossulfurico') || normalized.includes('acido iodossulfurico') || normalized.includes('acido nitrossulfurico') || normalized.includes('acido nitrosilssulfurico');
  if (organicByName) return 'organic';
  if (inorganicByName) return 'inorganic';
  for (const family of ORGANIC_FAMILIES) {
    if (normalized.includes(family)) return 'organic';
  }
  for (const family of INORGANIC_FAMILIES) {
    if (normalized.includes(family)) return 'inorganic';
  }
  if (normalized.includes('acido') || normalized.includes('ácido')) {
    return 'unknown';
  }
  return 'unknown';
}

function isOrganicAcid(compoundName) {
  return detectChemicalFamily(compoundName) === 'organic';
}

function isInorganicAcid(compoundName) {
  return detectChemicalFamily(compoundName) === 'inorganic';
}

function hasAcuteToxicityEvidence(hazardData) {
  if (!hazardData) return false;
  const acuteToxicityAttributes = [
    'acuteToxicity',
    'acuteToxicityOral',
    'acuteToxicityDermal',
    'acuteToxicityInhalation',
    'ld50',
    'lc50',
    'toxicityClass',
    'poisonous',
    'fatalIfSwallowed',
    'fatalInContactWithSkin',
    'fatalIfInhaled',
  ];
  for (const attr of acuteToxicityAttributes) {
    const value = hazardData[attr];
    if (value === true) return true;
    if (typeof value === 'string' && /(category\s*1|category\s*2|cat\s*1|cat\s*2|toxic|fatal|ld50|lc50)/i.test(value)) return true;
    if (typeof value === 'number' && (value > 0 && value <= 50)) return true;
  }
  if (Array.isArray(hazardData.hazardClasses)) {
    for (const h of hazardData.hazardClasses) {
      const s = String(h).toLowerCase();
      if (s.includes('acute toxicity') || s.includes('toxicidade aguda') || s.includes('toxico agudo') || s.includes('acute tox')) return true;
    }
  }
  if (Array.isArray(hazardData.hazardStatements)) {
    for (const h of hazardData.hazardStatements) {
      const s = String(h).toLowerCase();
      if (/^h300/.test(s) || /^h310/.test(s) || /^h330/.test(s) || /^h301/.test(s) || /^h311/.test(s) || /^h331/.test(s)) return true;
    }
  }
  if (Array.isArray(hazardData.pictograms)) {
    for (const p of hazardData.pictograms) {
      const s = String(p).toUpperCase();
      if (s.includes('GHS06') || s.includes('SKULL') || s.includes('TOXIC')) return true;
    }
  }
  return false;
}

function hasDominantFlammabilityEvidence(hazardData) {
  if (!hazardData) return false;
  const flammabilityAttributes = [
    'flammable',
    'highlyFlammable',
    'pyrophoric',
    'selfHeating',
    'waterReactiveFlammableGas',
    ' emitsFlammableGas',
    'aerosolFlammable',
  ];
  for (const attr of flammabilityAttributes) {
    const value = hazardData[attr];
    if (value === true) return true;
    if (typeof value === 'string' && /(category\s*1|category\s*2|cat\s*1|cat\s*2|extremely flammable|highly flammable|flammable|pyrophoric)/i.test(value)) return true;
  }
  if (Array.isArray(hazardData.hazardClasses)) {
    for (const h of hazardData.hazardClasses) {
      const s = String(h).toLowerCase();
      if (s.includes('flammable') || s.includes('inflamável') || s.includes('inflamavel') || s.includes('pyrophoric') || s.includes('piróforo') || s.includes('piroforo')) return true;
    }
  }
  if (Array.isArray(hazardData.hazardStatements)) {
    for (const h of hazardData.hazardStatements) {
      const s = String(h).toLowerCase();
      if (/^h220/.test(s) || /^h221/.test(s) || /^h222/.test(s) || /^h223/.test(s) || /^h224/.test(s) || /^h225/.test(s) || /^h226/.test(s) || /^h250/.test(s) || /^h251/.test(s) || /^h252/.test(s)) return true;
    }
  }
  if (Array.isArray(hazardData.pictograms)) {
    for (const p of hazardData.pictograms) {
      const s = String(p).toUpperCase();
      if (s.includes('GHS02') || s.includes('FLAME') || s.includes('INFLAMMABLE')) return true;
    }
  }
  if (hazardData.physicalState === 'gas' && (hazardData.flashPoint === null || hazardData.flashPoint === undefined)) {
    if (hazardData.lowerExplosiveLimit || hazardData.upperExplosiveLimit) return true;
  }
  return false;
}

function hasCorrosiveEvidence(hazardData) {
  if (!hazardData) return false;
  if (hazardData.corrosive === true || hazardData.skinCorrosion === true || hazardData.seriousEyeDamage === true) return true;
  if (typeof hazardData.pH === 'number') {
    if (hazardData.pH <= 2 || hazardData.pH >= 11.5) return true;
  }
  if (Array.isArray(hazardData.hazardClasses)) {
    for (const h of hazardData.hazardClasses) {
      const s = String(h).toLowerCase();
      if (s.includes('corrosive') || s.includes('corrosão') || s.includes('corrosao') || s.includes('skin corrosion') || s.includes('serious eye damage')) return true;
    }
  }
  if (Array.isArray(hazardData.hazardStatements)) {
    for (const h of hazardData.hazardStatements) {
      const s = String(h).toLowerCase();
      if (/^h314/.test(s) || /^h315/.test(s) || /^h318/.test(s) || /^h319/.test(s)) return true;
    }
  }
  if (Array.isArray(hazardData.pictograms)) {
    for (const p of hazardData.pictograms) {
      const s = String(p).toUpperCase();
      if (s.includes('GHS05') || s.includes('CORROSION')) return true;
    }
  }
  return false;
}

function classifyOrganicAcidMixture(compoundNames, hazardData) {
  const isLiquid = hazardData && hazardData.physicalState === 'liquid';
  const corrosive = hasCorrosiveEvidence(hazardData);
  const acuteToxic = hasAcuteToxicityEvidence(hazardData);
  const flammable = hasDominantFlammabilityEvidence(hazardData);
  if (acuteToxic && corrosive) {
    return UN_CODES.TOXIC_LIQUID_CORROSIVE_ORGANIC_N_O_S;
  }
  if (flammable && corrosive) {
    return UN_CODES.FLAMMABLE_LIQUID_CORROSIVE_N_O_S;
  }
  if (corrosive) {
    return UN_CODES.CORROSIVE_LIQUID_ACID_ORGANIC_N_O_S;
  }
  return UN_CODES.ENVIRONMENTALLY_HAZARDOUS_SUBSTANCE_LIQUID;
}

function classifyInorganicAcidMixture(compoundNames, hazardData) {
  const allInorganic = compoundNames.every((name) => isInorganicAcid(name));
  const isLiquid = hazardData && hazardData.physicalState === 'liquid';
  const corrosive = hasCorrosiveEvidence(hazardData);
  const acuteToxic = hasAcuteToxicityEvidence(hazardData);
  const flammable = hasDominantFlammabilityEvidence(hazardData);
  if (allInorganic && corrosive) {
    return UN_CODES.CORROSIVE_LIQUID_ACID_INORGANIC_N_O_S;
  }
  if (acuteToxic && corrosive) {
    return UN_CODES.TOXIC_LIQUID_CORROSIVE_ORGANIC_N_O_S;
  }
  if (flammable && corrosive) {
    return UN_CODES.FLAMMABLE_LIQUID_CORROSIVE_N_O_S;
  }
  if (corrosive) {
    return UN_CODES.CORROSIVE_LIQUID_N_O_S;
  }
  return UN_CODES.ENVIRONMENTALLY_HAZARDOUS_SUBSTANCE_LIQUID;
}

function classifyAcidMixture(compoundNames, hazardData) {
  if (!Array.isArray(compoundNames) || compoundNames.length === 0) {
    throw new Error('compoundNames must be a non-empty array');
  }
  const families = compoundNames.map(detectChemicalFamily);
  const hasOrganic = families.includes('organic');
  const hasInorganic = families.includes('inorganic');
  if (hasOrganic && !hasInorganic) {
    return classifyOrganicAcidMixture(compoundNames, hazardData);
  }
  if (hasInorganic && !hasOrganic) {
    return classifyInorganicAcidMixture(compoundNames, hazardData);
  }
  if (hasOrganic && hasInorganic) {
    const isLiquid = hazardData && hazardData.physicalState === 'liquid';
    const corrosive = hasCorrosiveEvidence(hazardData);
    const acuteToxic = hasAcuteToxicityEvidence(hazardData);
    const flammable = hasDominantFlammabilityEvidence(hazardData);
    if (corrosive) {
      if (acuteToxic) return UN_CODES.TOXIC_LIQUID_CORROSIVE_ORGANIC_N_O_S;
      if (flammable) return UN_CODES.FLAMMABLE_LIQUID_CORROSIVE_N_O_S;
      return UN_CODES.CORROSIVE_LIQUID_N_O_S;
    }
    return UN_CODES.ENVIRONMENTALLY_HAZARDOUS_SUBSTANCE_LIQUID;
  }
  const corrosive = hasCorrosiveEvidence(hazardData);
  if (corrosive) return UN_CODES.CORROSIVE_LIQUID_N_O_S;
  return UN_CODES.ENVIRONMENTALLY_HAZARDOUS_SUBSTANCE_LIQUID;
}

function applyPictogramRules(hazardData) {
  const pictograms = new Set();
  const corrosive = hasCorrosiveEvidence(hazardData);
  const acuteToxic = hasAcuteToxicityEvidence(hazardData);
  const flammable = hasDominantFlammabilityEvidence(hazardData);
  if (corrosive) {
    pictograms.add(PICTOGRAMS.GHS05);
  }
  if (acuteToxic) {
    pictograms.add(PICTOGRAMS.GHS06);
  }
  if (flammable) {
    pictograms.add(PICTOGRAMS.GHS02);
  }
  if (hazardData && hazardData.healthHazard) {
    pictograms.add(PICTOGRAMS.GHS07);
  }
  if (corrosive) {
    pictograms.delete(PICTOGRAMS.GHS07);
    if (!acuteToxic) {
      pictograms.delete(PICTOGRAMS.GHS06);
    }
    if (!flammable) {
      pictograms.delete(PICTOGRAMS.GHS02);
    }
  }
  return Array.from(pictograms).sort();
}

function classifyAndPictogram(compoundNames, hazardData) {
  const unNumber = classifyAcidMixture(compoundNames, hazardData);
  const pictograms = applyPictogramRules(hazardData);
  return {
    unNumber,
    pictograms,
    classificationBasis: 'chemical-family-precedence',
  };
}

const exporter = {
  classifyAcidMixture,
  classifyOrganicAcidMixture,
  classifyInorganicAcidMixture,
  applyPictogramRules,
  classifyAndPictogram,
  detectChemicalFamily,
  isOrganicAcid,
  isInorganicAcid,
  hasAcuteToxicityEvidence,
  hasDominantFlammabilityEvidence,
  hasCorrosiveEvidence,
  UN_CODES,
  PICTOGRAMS,
  ACIDO_BUTIRICO,
  ACIDO_VALERICO,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exporter;
} else {
  window.acidClassification = exporter;
}
