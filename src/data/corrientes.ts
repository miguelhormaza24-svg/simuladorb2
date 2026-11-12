// Generado por scripts/portar-prototipo.mjs a partir del prototipo v1 y del informe B2.
// Tabla 20 del informe B2. Cada valor numérico lleva su origen (D, I, S, P).
import type { Corriente } from './tipos';

export const CORRIENTES: Record<string, Corriente> = {
  "C01": {
    "id": "C01",
    "nombre": "Alimentación multifásica",
    "fase": "Gas, condensado y agua agria (+ MEG de B1)",
    "tipo": "hc_humedo",
    "color": "gas",
    "P": {
      "v": 50,
      "o": "S"
    },
    "T": {
      "v": 95,
      "o": "D"
    },
    "Tmax": {
      "v": 120,
      "o": "D"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 1.4,
      "o": "D"
    },
    "CO2": {
      "v": 1.8,
      "o": "D"
    },
    "agua": {
      "v": "si",
      "o": "D"
    },
    "pH": {
      "v": 3.9,
      "o": "D"
    },
    "Cl": {
      "v": 28000,
      "o": "D"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "wAgua": {
      "v": 100,
      "o": "P"
    },
    "nota": "320 bar es presión de CABEZAL B1; la planta usa Pd = 50 bar (S1). Cl⁻ de 28 000 mg/L aplica desde el año 8. Hay MEG continuo de B1, pero su proporción en el agua no está definida: el simulador no le da crédito (100 % agua) hasta tener el dato.",
    "material": "Acero sour/HIC en línea y recipientes, según agua."
  },
  "C02": {
    "id": "C02",
    "nombre": "Gas húmedo agrio",
    "fase": "Gas con vapor de agua, posible arrastre",
    "tipo": "gas_humedo",
    "color": "gas",
    "P": {
      "v": 50,
      "o": "S"
    },
    "T": {
      "v": 95,
      "o": "S"
    },
    "Tmax": {
      "v": 120,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 1.4,
      "o": "I"
    },
    "CO2": {
      "v": 1.8,
      "o": "I"
    },
    "agua": {
      "v": "condensa",
      "o": "P"
    },
    "pH": {
      "v": 3.9,
      "o": "D"
    },
    "Cl": {
      "v": 600,
      "o": "S"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "nota": "La separación quita líquido a granel, no seca ni endulza. Cl⁻ = 600 mg/L es el valor inicial de ISO 21457 6.2.3.2 para agua condensada.",
    "material": "API 5L/A106 sour candidato."
  },
  "C03": {
    "id": "C03",
    "nombre": "Condensado sin estabilizar",
    "fase": "Hidrocarburo líquido; posible agua",
    "tipo": "hc_humedo",
    "color": "liq",
    "P": {
      "v": 50,
      "o": "S"
    },
    "T": {
      "v": 95,
      "o": "S"
    },
    "Tmax": {
      "v": 120,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 1.4,
      "o": "I"
    },
    "CO2": {
      "v": 1.8,
      "o": "I"
    },
    "agua": {
      "v": "posible",
      "o": "P"
    },
    "pH": {
      "v": 3.9,
      "o": "P"
    },
    "Cl": {
      "v": 28000,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "nota": "Para CO₂ se usa el contenido y la presión de la última separación (ISO 21457 6.2.3.2). El pH 3,9 aplica a la fase acuosa, no al hidrocarburo.",
    "material": "A106/SA-516 candidato."
  },
  "C04": {
    "id": "C04",
    "nombre": "Agua producida / agria",
    "fase": "Fase acuosa con sales y gases disueltos",
    "tipo": "agua_agria",
    "color": "liq",
    "P": {
      "v": 50,
      "o": "S"
    },
    "T": {
      "v": 95,
      "o": "S"
    },
    "Tmax": {
      "v": 120,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 1.4,
      "o": "I"
    },
    "CO2": {
      "v": 1.8,
      "o": "I"
    },
    "agua": {
      "v": "si",
      "o": "D"
    },
    "pH": {
      "v": 3.9,
      "o": "D"
    },
    "Cl": {
      "v": 28000,
      "o": "D"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "nota": "pH y H₂S/CO₂ disueltos en la salida no medidos; MEG por confirmar con B1.",
    "material": "Acero sour revestido o alternativa por corrosión."
  },
  "C05-R": {
    "id": "C05-R",
    "nombre": "Amina rica",
    "fase": "Amina acuosa cargada con gas ácido",
    "tipo": "amina_rica",
    "color": "amina",
    "P": {
      "v": 50,
      "o": "S"
    },
    "T": {
      "v": 60,
      "o": "S"
    },
    "Tmax": {
      "v": 100,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 1.4,
      "o": "I"
    },
    "CO2": {
      "v": 1.8,
      "o": "I"
    },
    "agua": {
      "v": "si",
      "o": "I"
    },
    "pH": {
      "v": 9,
      "o": "S"
    },
    "Cl": {
      "v": 0,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "amina": {
      "tipo": "MDEA",
      "conc": 45,
      "carga": 0.45,
      "vel": 1,
      "hss": 1
    },
    "nota": "Tipo de amina, % amina, carga ácida, velocidad y HSS sin dato: valores típicos para que el simulador calcule.",
    "material": "A106/SA-516 con control de química, candidato."
  },
  "C05-P": {
    "id": "C05-P",
    "nombre": "Amina pobre",
    "fase": "Amina acuosa regenerada",
    "tipo": "amina_pobre",
    "color": "amina",
    "P": {
      "v": 2,
      "o": "S"
    },
    "T": {
      "v": 120,
      "o": "S"
    },
    "Tmax": {
      "v": 130,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 0.01,
      "o": "S"
    },
    "CO2": {
      "v": 0.01,
      "o": "S"
    },
    "agua": {
      "v": "si",
      "o": "I"
    },
    "pH": {
      "v": 10.5,
      "o": "S"
    },
    "Cl": {
      "v": 0,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "amina": {
      "tipo": "MDEA",
      "conc": 45,
      "carga": 0.01,
      "vel": 1.5,
      "hss": 1
    },
    "nota": "Más caliente aguas arriba del enfriador; T de película y carga residual sin dato.",
    "material": "A106/SA-516; internos inox solo justificados."
  },
  "C06": {
    "id": "C06",
    "nombre": "Gas ácido de aminas",
    "fase": "H₂S/CO₂ con vapor de agua",
    "tipo": "gas_acido",
    "color": "acido",
    "P": {
      "v": 1.8,
      "o": "S"
    },
    "T": {
      "v": 45,
      "o": "S"
    },
    "Tmax": {
      "v": 110,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 43.8,
      "o": "I"
    },
    "CO2": {
      "v": 56.2,
      "o": "I"
    },
    "agua": {
      "v": "condensa",
      "o": "I"
    },
    "pH": {
      "v": 4,
      "o": "S"
    },
    "Cl": {
      "v": 0,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "nota": "Composición seca inferida de la relación H₂S/CO₂ de la alimentación (1,4 : 1,8). Condensa agua ácida en la cabeza.",
    "material": "Material sour según exposición húmeda."
  },
  "C07": {
    "id": "C07",
    "nombre": "Gas endulzado húmedo",
    "fase": "Gas con H₂S/CO₂ reducidos; aún húmedo",
    "tipo": "gas_humedo",
    "color": "gas",
    "P": {
      "v": 50,
      "o": "S"
    },
    "T": {
      "v": 45,
      "o": "S"
    },
    "Tmax": {
      "v": 60,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 0.0004,
      "o": "S"
    },
    "CO2": {
      "v": 0.1,
      "o": "S"
    },
    "agua": {
      "v": "condensa",
      "o": "P"
    },
    "pH": {
      "v": 4.5,
      "o": "S"
    },
    "Cl": {
      "v": 0,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "nota": "Residual ácido sin dato: 4 ppmv H₂S y 0,1 % CO₂ son supuestos de especificación típica. Pruebe subir el H₂S residual.",
    "material": "A106 Gr B candidato condicionado."
  },
  "C08-R": {
    "id": "C08-R",
    "nombre": "TEG rico",
    "fase": "TEG que absorbió agua y contaminantes",
    "tipo": "teg",
    "color": "teg",
    "P": {
      "v": 50,
      "o": "S"
    },
    "T": {
      "v": 45,
      "o": "S"
    },
    "Tmax": {
      "v": 60,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 0.0004,
      "o": "S"
    },
    "CO2": {
      "v": 0.1,
      "o": "S"
    },
    "agua": {
      "v": "si",
      "o": "I"
    },
    "pH": {
      "v": 7,
      "o": "S"
    },
    "Cl": {
      "v": 0,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "teg": {
      "Tpel": 60,
      "contaminado": "no"
    },
    "nota": "5 m³/h es referencia, no dato del proyecto.",
    "material": "A106 Gr B; 316L localizado por química."
  },
  "C08-P": {
    "id": "C08-P",
    "nombre": "TEG pobre caliente",
    "fase": "TEG regenerado caliente",
    "tipo": "teg",
    "color": "teg",
    "P": {
      "v": 1.1,
      "o": "S"
    },
    "T": {
      "v": 200,
      "o": "S"
    },
    "Tmax": {
      "v": 204,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 0,
      "o": "S"
    },
    "CO2": {
      "v": 0,
      "o": "S"
    },
    "agua": {
      "v": "no",
      "o": "S"
    },
    "pH": {
      "v": 7,
      "o": "S"
    },
    "Cl": {
      "v": 0,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "teg": {
      "Tpel": 215,
      "contaminado": "no"
    },
    "nota": "T de película y concentración de TEG sin dato. 204 °C es el límite típico de rehervidor para evitar degradación térmica (literatura de proceso).",
    "material": "A106 Gr B; tubos 316L como candidato."
  },
  "C09-V": {
    "id": "C09-V",
    "nombre": "Vapores de TEG (still)",
    "fase": "Vapor de agua y gases; condensable",
    "tipo": "vapor_acido",
    "color": "acido",
    "P": {
      "v": 1.1,
      "o": "S"
    },
    "T": {
      "v": 100,
      "o": "S"
    },
    "Tmax": {
      "v": 110,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 0.1,
      "o": "S"
    },
    "CO2": {
      "v": 2,
      "o": "S"
    },
    "agua": {
      "v": "condensa",
      "o": "I"
    },
    "pH": {
      "v": 4.5,
      "o": "S"
    },
    "Cl": {
      "v": 0,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "nota": "P/T/composición/caudal sin dato. Vapor y drenaje no se evalúan como una sola fase.",
    "material": "A106 sour si condensa fase ácida."
  },
  "C09-D": {
    "id": "C09-D",
    "nombre": "Drenajes cerrados TEG",
    "fase": "Líquidos acuosos, TEG y trazas",
    "tipo": "drenaje",
    "color": "liq",
    "P": {
      "v": 1.5,
      "o": "S"
    },
    "T": {
      "v": 60,
      "o": "S"
    },
    "Tmax": {
      "v": 100,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 0.1,
      "o": "S"
    },
    "CO2": {
      "v": 2,
      "o": "S"
    },
    "agua": {
      "v": "si",
      "o": "I"
    },
    "pH": {
      "v": 5,
      "o": "S"
    },
    "Cl": {
      "v": 1000,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "nota": "Composición variable según origen: analizar cada ramal.",
    "material": "Acero compatible por subramal."
  },
  "C10": {
    "id": "C10",
    "nombre": "Gas seco / acondicionado",
    "fase": "Gas tratado; posible condensación al enfriar",
    "tipo": "gas_seco",
    "color": "gas",
    "P": {
      "v": 50,
      "o": "S"
    },
    "T": {
      "v": 45,
      "o": "S"
    },
    "Tmax": {
      "v": 60,
      "o": "S"
    },
    "Tmin": {
      "v": 5,
      "o": "S"
    },
    "H2S": {
      "v": 0.0004,
      "o": "S"
    },
    "CO2": {
      "v": 0.1,
      "o": "S"
    },
    "agua": {
      "v": "no",
      "o": "P"
    },
    "pH": {
      "v": 4.5,
      "o": "S"
    },
    "Cl": {
      "v": 0,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "rocio": {
      "v": -10,
      "o": "S"
    },
    "nota": "Punto de rocío/residual ácido sin dato. Seco solo si el rocío está ≥ 10 °C por debajo de la T mínima (ISO 21457 6.2.3.5).",
    "material": "A106 Gr B candidato en servicio demostrado."
  },
  "MC": {
    "id": "MC",
    "nombre": "Medio de calentamiento (B3)",
    "fase": "Vapor de baja presión o aceite térmico",
    "tipo": "servicio",
    "color": "serv",
    "P": {
      "v": 4,
      "o": "P"
    },
    "T": {
      "v": 150,
      "o": "P"
    },
    "Tmax": {
      "v": 160,
      "o": "P"
    },
    "Tmin": {
      "v": 5,
      "o": "P"
    },
    "H2S": {
      "v": 0,
      "o": "P"
    },
    "CO2": {
      "v": 0,
      "o": "P"
    },
    "agua": {
      "v": "no",
      "o": "P"
    },
    "pH": {
      "v": 9,
      "o": "P"
    },
    "Cl": {
      "v": 0,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "nota": "El medio de calentamiento de los rehervidores no está definido en el informe: por acordar con B3.",
    "material": "Por definir con B3."
  },
  "C13-F": {
    "id": "C13-F",
    "nombre": "Agua dulce de enfriamiento cerrada (B3, condicional)",
    "fase": "Agua dulce tratada en circuito cerrado",
    "tipo": "servicio",
    "color": "serv",
    "P": {
      "v": 4,
      "o": "P"
    },
    "T": {
      "v": 35,
      "o": "P"
    },
    "Tmax": {
      "v": 45,
      "o": "P"
    },
    "Tmin": {
      "v": 20,
      "o": "P"
    },
    "H2S": {
      "v": 0,
      "o": "P"
    },
    "CO2": {
      "v": 0,
      "o": "P"
    },
    "agua": {
      "v": "si",
      "o": "P"
    },
    "pH": {
      "v": 8.5,
      "o": "P"
    },
    "Cl": {
      "v": 0,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "nota": "Solo existe si B3 la asigna por acta; el caso base del enunciado es agua de mar clorada (C13-W).",
    "material": "Acero al carbono (A106/A53/SA-179) solo si se confirma."
  },
  "C13-W": {
    "id": "C13-W",
    "nombre": "Agua de mar clorada (B3)",
    "fase": "Agua de mar clorada, lado frío",
    "tipo": "agua_mar",
    "color": "serv",
    "P": {
      "v": 4,
      "o": "P"
    },
    "T": {
      "v": 35,
      "o": "P"
    },
    "Tmax": {
      "v": 45,
      "o": "P"
    },
    "Tmin": {
      "v": 20,
      "o": "P"
    },
    "H2S": {
      "v": 0,
      "o": "P"
    },
    "CO2": {
      "v": 0,
      "o": "P"
    },
    "agua": {
      "v": "si",
      "o": "D"
    },
    "pH": {
      "v": 8.1,
      "o": "P"
    },
    "Cl": {
      "v": 19000,
      "o": "P"
    },
    "HCO3": {
      "v": 0,
      "o": "P"
    },
    "nota": "Cloro residual, T, O₂ y velocidad por acta B2–B3. El flujo de B2 indica que C13-W alimenta el enfriador de amina y condensadores.",
    "material": "Titanio Gr 2 / 6Mo en lado agua como opciones."
  }
};
