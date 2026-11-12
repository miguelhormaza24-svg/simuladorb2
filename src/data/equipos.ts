// Generado por scripts/portar-prototipo.mjs a partir del prototipo v1 y del informe B2.
// Tablas 8 a 12 del informe B2: los ocho equipos del alcance y sus piezas.
import type { Equipo } from './tipos';

export const EQUIPOS: Equipo[] = [
  {
    "id": "E1-REC",
    "n": 1,
    "etapa": 1,
    "nombre": "Recibidor de líquidos (slug catcher)",
    "corto": "Recibidor",
    "entradas": [
      "C01"
    ],
    "salidas": [
      "C01"
    ],
    "funcion": "Recibe la alimentación multifásica después de la válvula de llegada y amortigua los tapones de líquido antes del separador.",
    "proceso": "separador",
    "dim": {
      "D": 1.2,
      "L": 4.5,
      "e": 35
    },
    "piezas": [
      {
        "id": "cuerpo",
        "nombre": "Cuerpo y cabezales",
        "forma": "recipiente",
        "corriente": "C01",
        "inv": "cs",
        "invTxt": "SA-516 Gr 70N con requisito sour/HIC y revestimiento local si aplica",
        "dim": "Ø int. 1,2 m × L 4,5 m; e = 35 mm",
        "cant": "1 cuerpo + 2 cabezales",
        "norma": "ASME VIII-1; ISO 15156-2",
        "ext": true
      },
      {
        "id": "boq",
        "nombre": "Boquillas y registros",
        "forma": "boquilla",
        "corriente": "C01",
        "inv": "cs",
        "invTxt": "SA-105N / SA-350 LF2 con requisitos sour (candidato)",
        "dim": "Entrada NPS 8; gas NPS 8; líquidos NPS 3; manway 18 in",
        "cant": "4 boquillas + 1 manway",
        "norma": "ASME VIII; ASME B16.5",
        "ext": true,
        "nps": "8-80"
      },
      {
        "id": "demister",
        "nombre": "Demister y soporte interno",
        "forma": "internos",
        "corriente": "C01",
        "inv": "ss316",
        "invTxt": "Malla SS316L, validar cloruros y fase acuosa",
        "dim": "Módulo Ø 0,9 m × 0,15 m",
        "cant": "1",
        "norma": "ASME VIII; ISO 21457"
      },
      {
        "id": "sellos",
        "nombre": "Juntas y sellos elastoméricos",
        "forma": "sello",
        "corriente": "C01",
        "invTxt": "No definido en inventario",
        "dim": "Manway 18 in, instrumentos",
        "cant": "Por P&ID",
        "norma": "ISO 23936-2"
      }
    ]
  },
  {
    "id": "E1-SEP",
    "n": 2,
    "etapa": 1,
    "nombre": "Separador de entrada (trifásico)",
    "corto": "Separador",
    "entradas": [
      "C01"
    ],
    "salidas": [
      "C02",
      "C03",
      "C04"
    ],
    "funcion": "Separa gas húmedo (C02), condensado sin estabilizar (C03) y agua agria (C04).",
    "proceso": "separador",
    "dim": {
      "D": 1.8,
      "L": 6,
      "e": 45
    },
    "piezas": [
      {
        "id": "virola",
        "nombre": "Virola y cabezales (zona de agua)",
        "forma": "recipiente",
        "corriente": "C04",
        "inv": "cs",
        "invTxt": "SA-516 Gr 70N sour/HIC, sobreespesor 3 mm preliminar",
        "dim": "Ø int. 1,8 m × L 6,0 m; e = 45 mm",
        "cant": "1 cuerpo + 2 cabezales",
        "norma": "ASME VIII-1; ISO 15156-2",
        "ext": true,
        "caInv": 3
      },
      {
        "id": "internos",
        "nombre": "Deflector y extractor de niebla",
        "forma": "internos",
        "corriente": "C01",
        "inv": "ss316",
        "invTxt": "Acero 316L / dúplex local si la corrosión lo exige",
        "dim": "Deflector 600×500×8 mm; demister Ø 1,5 m × 150 mm",
        "cant": "1 + 1",
        "norma": "ISO 21457; ASME VIII"
      },
      {
        "id": "boq",
        "nombre": "Boquillas y válvula de nivel",
        "forma": "boquilla",
        "corriente": "C04",
        "inv": "cs",
        "invTxt": "SA-105N sour para boquillas; trim CRA para válvula",
        "dim": "Gas NPS 8; líquido NPS 3; agua NPS 2",
        "cant": "5 boquillas + 2 válvulas",
        "norma": "ASME B31.3; API 6D",
        "ext": true,
        "nps": "2-80"
      },
      {
        "id": "sellos",
        "nombre": "Juntas y sellos (válvula de nivel, instrumentos)",
        "forma": "sello",
        "corriente": "C01",
        "invTxt": "No definido en inventario",
        "dim": "Empaques de vástago, O-rings",
        "cant": "Por P&ID",
        "norma": "ISO 23936-2; API 6A Anexo F (comparativa)"
      }
    ]
  },
  {
    "id": "E2-ABS",
    "n": 3,
    "etapa": 2,
    "nombre": "Absorbedor de aminas",
    "corto": "Absorbedor",
    "entradas": [
      "C02",
      "C05-P"
    ],
    "salidas": [
      "C07",
      "C05-R"
    ],
    "funcion": "Contacto gas–amina en contracorriente: remueve H₂S y CO₂ del gas húmedo agrio.",
    "proceso": "columna",
    "dim": {
      "D": 1.5,
      "L": 14,
      "e": 35
    },
    "piezas": [
      {
        "id": "cuerpo",
        "nombre": "Cuerpo, fondos y bridas (fondo con amina rica)",
        "forma": "recipiente",
        "corriente": "C05-R",
        "inv": "cs",
        "invTxt": "SA-516 Gr 70N sour/HIC; recubrimiento CRA solo si se justifica",
        "dim": "Ø int. 1,5 m × H 14 m; e = 35 mm (estimado)",
        "cant": "1 cuerpo + 2 cabezales",
        "norma": "ASME VIII-1; API RP 945; ISO 15156",
        "ext": true,
        "T": 55,
        "Tmax": 60
      },
      {
        "id": "bandejas",
        "nombre": "Bandejas o empaque y soportes",
        "forma": "internos",
        "corriente": "C05-R",
        "inv": "ss316",
        "invTxt": "SS316L",
        "dim": "18 bandejas; Ø 1,45 m; separación 0,55 m",
        "cant": "18 + soportes",
        "norma": "API RP 945; ISO 21457",
        "T": 55,
        "Tmax": 60
      },
      {
        "id": "boq",
        "nombre": "Boquillas y distribuidores (entrada de gas)",
        "forma": "boquilla",
        "corriente": "C02",
        "inv": "cs",
        "invTxt": "SA-105N sour + internos SS316L candidato",
        "dim": "Gas NPS 8; amina NPS 3; salida gas NPS 8",
        "cant": "6 boquillas + 2 distribuidores",
        "norma": "ASME VIII; API RP 945",
        "ext": true,
        "nps": "8-80"
      },
      {
        "id": "sellos",
        "nombre": "Juntas y sellos",
        "forma": "sello",
        "corriente": "C05-R",
        "invTxt": "No definido en inventario",
        "dim": "Manway, instrumentos de nivel",
        "cant": "Por P&ID",
        "norma": "ISO 23936-2"
      }
    ]
  },
  {
    "id": "E2-REG",
    "n": 4,
    "etapa": 2,
    "nombre": "Regenerador de aminas",
    "corto": "Regenerador amina",
    "entradas": [
      "C05-R"
    ],
    "salidas": [
      "C06",
      "C05-P"
    ],
    "funcion": "Despoja el gas ácido de la amina rica caliente; la cabeza entrega gas ácido (C06) y el fondo amina pobre (C05-P).",
    "proceso": "columna",
    "dim": {
      "D": 1.2,
      "L": 11,
      "e": 18
    },
    "piezas": [
      {
        "id": "cuerpo",
        "nombre": "Cuerpo y fondos",
        "forma": "recipiente",
        "corriente": "C05-R",
        "inv": "cs",
        "invTxt": "SA-516 Gr 70N con control SCC amina",
        "dim": "Ø int. 1,2 m × H 11 m; e = 18 mm",
        "cant": "1",
        "norma": "ASME VIII-1; API RP 945",
        "ext": true,
        "P": 2,
        "T": 115
      },
      {
        "id": "bandejas",
        "nombre": "Bandejas y soporte",
        "forma": "internos",
        "corriente": "C05-R",
        "inv": "ss316",
        "invTxt": "SS316L o material de empaque compatible",
        "dim": "16 bandejas Ø 1,15 m",
        "cant": "16",
        "norma": "API RP 945; ISO 21457",
        "P": 2,
        "T": 115
      },
      {
        "id": "cabeza",
        "nombre": "Cabeza: recipiente de reflujo y línea de gas ácido",
        "forma": "recipiente",
        "corriente": "C06",
        "inv": "cs",
        "invTxt": "SA-516 Gr 70N carcasa",
        "dim": "Vaso Ø 0,9 × 2,5 m",
        "cant": "1",
        "norma": "TEMA; ASME VIII; API RP 945",
        "ext": true,
        "T": 45,
        "Tmax": 60
      },
      {
        "id": "cond",
        "nombre": "Condensador de cabeza: tubos",
        "forma": "tubos",
        "corriente": "C06",
        "servicio": "C13-W",
        "inv": "ss316",
        "invTxt": "Tubos SS316L candidato (lado agua según acta B2–B3)",
        "dim": "Condensador Ø 0,55 × 3 m",
        "cant": "1",
        "norma": "TEMA; ASME VIII; ISO 21457 7.2.2"
      },
      {
        "id": "sellos",
        "nombre": "Juntas y sellos",
        "forma": "sello",
        "corriente": "C05-R",
        "invTxt": "No definido en inventario",
        "dim": "Bridas de cabeza, instrumentos",
        "cant": "Por P&ID",
        "norma": "ISO 23936-2"
      }
    ]
  },
  {
    "id": "E2-REH",
    "n": 5,
    "etapa": 2,
    "nombre": "Rehervidor de aminas",
    "corto": "Rehervidor amina",
    "entradas": [
      "C05-P",
      "MC"
    ],
    "salidas": [
      "C05-P"
    ],
    "funcion": "Suministra el calor de despojo al fondo del regenerador; zona más caliente del circuito de amina.",
    "proceso": "hx",
    "dim": {
      "D": 0.9,
      "L": 3.5,
      "e": 20
    },
    "piezas": [
      {
        "id": "carcasa",
        "nombre": "Carcasa / cuerpo (lado amina)",
        "forma": "recipiente",
        "corriente": "C05-P",
        "inv": "cs",
        "invTxt": "SA-516 Gr 70N con diseño térmico y control SCC",
        "dim": "Ø 0,9 m × L 3,5 m; e = 20 mm",
        "cant": "1",
        "norma": "ASME VIII; TEMA; API RP 945",
        "ext": true,
        "T": 125
      },
      {
        "id": "tubos",
        "nombre": "Tubos calefactores",
        "forma": "tubos",
        "corriente": "C05-P",
        "servicio": "MC",
        "inv": "ss316",
        "invTxt": "SS316L candidato; verificar temperatura de película",
        "dim": "¾ in OD × 3,5 m × 150 tubos",
        "cant": "150",
        "norma": "TEMA; ASTM A213; API RP 945",
        "T": 135
      },
      {
        "id": "sellos",
        "nombre": "Juntas de canal y carcasa",
        "forma": "sello",
        "corriente": "C05-P",
        "invTxt": "No definido en inventario",
        "dim": "Juntas de cabezal",
        "cant": "Por diseño",
        "norma": "ISO 23936-2"
      }
    ]
  },
  {
    "id": "E2-HX",
    "n": 6,
    "etapa": 2,
    "nombre": "Intercambiador amina rica/pobre",
    "corto": "Interc. rica/pobre",
    "entradas": [
      "C05-R",
      "C05-P"
    ],
    "salidas": [
      "C05-R",
      "C05-P"
    ],
    "funcion": "Precalienta la amina rica con la amina pobre caliente; la salida caliente de la rica es el punto crítico (flashing de gas ácido).",
    "proceso": "hx",
    "dim": {
      "D": 0.7,
      "L": 4,
      "e": 16
    },
    "piezas": [
      {
        "id": "carcasa",
        "nombre": "Carcasa (lado amina pobre)",
        "forma": "recipiente",
        "corriente": "C05-P",
        "inv": "cs",
        "invTxt": "SA-516 Gr 70N con evaluación de amina",
        "dim": "Ø 0,7 m × L 4 m; e = 16 mm",
        "cant": "1",
        "norma": "TEMA; ASME VIII; API RP 945",
        "ext": true,
        "P": 6,
        "T": 120
      },
      {
        "id": "tubos",
        "nombre": "Haz tubular (amina rica caliente)",
        "forma": "tubos",
        "corriente": "C05-R",
        "servicio": "C05-P",
        "inv": "ss316",
        "invTxt": "SS316L en tubos (candidato sujeto a fluido)",
        "dim": "Tubos ¾ in OD × 4 m × 180",
        "cant": "180 tubos",
        "norma": "ASTM A213/A269; TEMA; API RP 945",
        "P": 6,
        "T": 95
      },
      {
        "id": "placa",
        "nombre": "Placas tubulares",
        "forma": "recipiente",
        "corriente": "C05-R",
        "inv": "cs_c316",
        "invTxt": "Placa SA-516 con revestimiento",
        "dim": "2 placas",
        "cant": "2",
        "norma": "TEMA; ASME VIII",
        "P": 6,
        "T": 95
      },
      {
        "id": "sellos",
        "nombre": "Juntas de canal y carcasa",
        "forma": "sello",
        "corriente": "C05-R",
        "invTxt": "No definido en inventario",
        "dim": "Juntas de cabezal",
        "cant": "Por diseño",
        "norma": "ISO 23936-2"
      }
    ]
  },
  {
    "id": "E3-CON",
    "n": 7,
    "etapa": 3,
    "nombre": "Contactor de TEG",
    "corto": "Contactor TEG",
    "entradas": [
      "C07",
      "C08-P"
    ],
    "salidas": [
      "C10",
      "C08-R"
    ],
    "funcion": "Deshidrata el gas endulzado húmedo por contacto con TEG pobre; entrega gas seco (C10).",
    "proceso": "columna",
    "dim": {
      "D": 1.2,
      "L": 10,
      "e": 30
    },
    "piezas": [
      {
        "id": "cuerpo",
        "nombre": "Cuerpo, virola, fondos, boquillas y bridas",
        "forma": "recipiente",
        "corriente": "C07",
        "inv": "cs",
        "invTxt": "SA-516 Gr 70N / SA-105N; acero sour SSC/HIC si hay H₂S húmedo; overlay 316L solo localizado",
        "dim": "Dimensiones por balance de proceso",
        "cant": "1 recipiente",
        "norma": "ASME VIII-1; ISO 21457; ISO 15156-1/-2",
        "ext": true
      },
      {
        "id": "internos",
        "nombre": "Bandejas, distribuidores, chimney tray y demister",
        "forma": "internos",
        "corriente": "C08-R",
        "inv": "ss316",
        "invTxt": "SA-240 TP316L / A276 316L; 2205 o 6Mo solo si se exceden límites del 316L",
        "dim": "1 conjunto",
        "cant": "1",
        "norma": "ASME VIII-1; ISO 21457; ISO 15156-3"
      },
      {
        "id": "salida",
        "nombre": "Línea de salida de gas deshidratado",
        "forma": "tuberia",
        "corriente": "C10",
        "inv": "cs",
        "invTxt": "ASTM A106 Gr B sin costura (condicionado a punto de rocío y ausencia de agua libre)",
        "dim": "NPS 8 Sch 80; e = 12,70 mm",
        "cant": "1 línea",
        "norma": "ASME B31.3; ISO 21457; ISO 15156",
        "ext": true,
        "nps": "8-80"
      },
      {
        "id": "sellos",
        "nombre": "Juntas y sellos",
        "forma": "sello",
        "corriente": "C07",
        "invTxt": "No definido en inventario",
        "dim": "Manway, instrumentos",
        "cant": "Por P&ID",
        "norma": "ISO 23936-2"
      }
    ]
  },
  {
    "id": "E3-REG",
    "n": 8,
    "etapa": 3,
    "nombre": "Regenerador de TEG (columna still + rehervidor)",
    "corto": "Regenerador TEG",
    "entradas": [
      "C08-R",
      "MC"
    ],
    "salidas": [
      "C08-P",
      "C09-V",
      "C09-D"
    ],
    "funcion": "Hierve el agua del TEG rico; la cabeza ventea vapores (C09-V) y el fondo devuelve TEG pobre caliente (C08-P).",
    "proceso": "columna",
    "dim": {
      "D": 0.4,
      "L": 4,
      "e": 10
    },
    "piezas": [
      {
        "id": "cuerpo",
        "nombre": "Columna still: cuerpo, fondos, boquillas",
        "forma": "recipiente",
        "corriente": "C09-V",
        "inv": "cs",
        "invTxt": "SA-516 Gr 70N; SA-105N. Overlay 316L localizado solo si el condensado lo justifica",
        "dim": "Ø int. 0,40 m; 3 etapas (incl. rehervidor)",
        "cant": "1 columna",
        "norma": "ASME VIII-1; ISO 21457; ISO 15156",
        "ext": true
      },
      {
        "id": "empaque",
        "nombre": "Empaque/bandejas, distribuidor, demister",
        "forma": "internos",
        "corriente": "C09-V",
        "inv": "ss316",
        "invTxt": "SA-240 TP316L / A276 316L (condicionado); 2205/6Mo si no alcanza",
        "dim": "1 conjunto",
        "cant": "1",
        "norma": "ASME VIII-1; ISO 21457; ISO 15156-3"
      },
      {
        "id": "venteo",
        "nombre": "Venteo / overhead de la columna",
        "forma": "tuberia",
        "corriente": "C09-V",
        "inv": "cs",
        "invTxt": "ASTM A106 Gr B; 316L o dúplex solo si la corrosión lo justifica",
        "dim": "NPS 2 Sch 40; e = 3,91 mm",
        "cant": "1 interfaz",
        "norma": "ASME B31.3; ISO 21457; ISO 15156",
        "ext": true,
        "nps": "2-40"
      },
      {
        "id": "reh_carc",
        "nombre": "Rehervidor de TEG: carcasa y tubesheet",
        "forma": "recipiente",
        "corriente": "C08-P",
        "inv": "cs",
        "invTxt": "SA-516 Gr 70N; SA-105N. Overlay 316L en cara mojada solo si se justifica",
        "dim": "Horizontal; Ø 0,90 m × L 3,50 m",
        "cant": "1",
        "norma": "ASME VIII-1; ISO 16812 / API 660; TEMA",
        "ext": true
      },
      {
        "id": "reh_tubos",
        "nombre": "Rehervidor de TEG: haz tubular",
        "forma": "tubos",
        "corriente": "C08-P",
        "servicio": "MC",
        "inv": "ss316",
        "invTxt": "ASTM A213 TP316L sin costura (candidato)",
        "dim": "¾ in OD × 3,0 m",
        "cant": "1 haz",
        "norma": "ASTM A213; ISO 16812; API 660"
      },
      {
        "id": "drenajes",
        "nombre": "Puntos bajos y drenajes",
        "forma": "tuberia",
        "corriente": "C09-D",
        "inv": "cs",
        "invTxt": "A106 Gr B (TEG limpio); acero sour o CRA para condensados acuosos calientes",
        "dim": "Ramales NPS 1½ Sch 80; e = 5,08 mm",
        "cant": "1 red",
        "norma": "ASME B31.3; ISO 21457",
        "ext": true,
        "nps": "1.5-80"
      },
      {
        "id": "sellos",
        "nombre": "Juntas y sellos",
        "forma": "sello",
        "corriente": "C08-P",
        "invTxt": "No definido en inventario",
        "dim": "Bridas, instrumentos",
        "cant": "Por P&ID",
        "norma": "ISO 23936-2"
      }
    ]
  }
];

/** Diámetro interior (mm) por «NPS-Schedule», para velocidades en boquillas. */
export const DI_TUBERIA: Record<string, number> = {
  "8-80": 193.7,
  "4-80": 97.2,
  "3-80": 73.7,
  "2-80": 49.2,
  "2-40": 52.5,
  "1.5-80": 38.1
};
