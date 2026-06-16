const db = [
  {
    CAS_Number: "Vários",
    IUPAC_Name: "Mistura Diclorometano/Metanol",
    Common_Name: "Resíduo de Solvente Orgânico Halogenado",
    Molecular_Formula: "CH2Cl2 + CH3OH",
    UN_Number: "1992",
    Risk_Class: "3 (Líquido Inflamável) / Risco Subsidiário: 6.1 (Tóxico)",
    Hazard_Code: "D001",
    RDC222_Group: "Grupo B",
    Warning_Word: "PERIGO",
    H_Phrases: [
      "H225: Líquido e vapores altamente inflamáveis.",
      "H301 + H311 + H331: Tóxico se ingerido, em contato com a pele ou inalado.",
      "H351: Suspeito de provocar câncer.",
      "H371: Pode provocar danos aos órgãos."
    ],
    P_Phrases: [
      "P210: Mantenha afastado do calor, faíscas, chama aberta e superfícies quentes. Não fume.",
      "P280: Use luvas de proteção, roupa de proteção, proteção ocular e proteção facial."
    ],
    Pictograms_List: ["ghs02_inflamavel", "ghs06_toxico", "ghs08_saude"]
  },
  {
    CAS_Number: "7664-93-9",
    IUPAC_Name: "Sulfuric acid",
    Common_Name: "Ácido Sulfúrico",
    Molecular_Formula: "H2SO4",
    UN_Number: "1830",
    Risk_Class: "8 (Corrosivo)",
    Hazard_Code: "D002",
    RDC222_Group: "Grupo B",
    Warning_Word: "PERIGO",
    H_Phrases: [
      "H314: Provoca queimadura severa à pele e dano aos olhos.",
      "H290: Pode ser corrosivo para os metais."
    ],
    P_Phrases: [
      "P260: Não inale as poeiras/fumos/gases/névoas."
    ],
    Pictograms_List: ["ghs05_corrosivo", "ghs06_toxico"]
  },
  {
    CAS_Number: "71-43-2",
    IUPAC_Name: "Benzene",
    Common_Name: "Benzeno",
    Molecular_Formula: "C6H6",
    UN_Number: "1114",
    Risk_Class: "3 (Líquido Inflamável)",
    Hazard_Code: "D001",
    RDC222_Group: "Grupo B",
    Warning_Word: "PERIGO",
    H_Phrases: [
      "H225: Líquido e vapores altamente inflamáveis.",
      "H350: Pode provocar câncer.",
      "H340: Pode provocar defeitos genéticos."
    ],
    P_Phrases: [
      "P201: Obtenha instruções específicas antes da utilização."
    ],
    Pictograms_List: ["ghs02_inflamavel", "ghs08_saude"]
  }
];
