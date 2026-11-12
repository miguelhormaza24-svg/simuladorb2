// Generado por scripts/portar-prototipo.mjs a partir del prototipo v1 y del informe B2.
// Tabla 22 del informe B2 (matriz de cribado por corriente).
import type { MecanismoCorriente } from './tipos';

export const MECANISMOS: Record<string, MecanismoCorriente> = {
  "C01": {
    "P": "CO₂ húmedo, SSC/HIC; corrosión externa marina.",
    "V": "Erosión, galvánica, MIC, SCC Cl⁻ (componentes inox).",
    "D": "Agrietamiento por aminas: NA sin amina.",
    "J": "Agua ácida y H₂S confirmados; cuantificar corrosión, revisar durezas y cloruros año 8."
  },
  "C02": {
    "P": "CO₂ húmedo, SSC/HIC si hay fase acuosa.",
    "V": "Erosión, MIC, SCC Cl⁻ por arrastre; TLC si el gas condensa en la parte superior de la línea.",
    "D": "Agrietamiento por aminas: NA antes del absorbedor.",
    "J": "La separación quita líquidos a granel, no seca ni endulza."
  },
  "C03": {
    "P": "CO₂/H₂S con agua libre; depósitos.",
    "V": "SSC/HIC, cloruros, erosión, MIC según agua y almacenamiento.",
    "D": "Agrietamiento por aminas: NA sin contaminación.",
    "J": "Distinguir condensado húmedo previo y producto estabilizado."
  },
  "C04": {
    "P": "CO₂, SSC/HIC, corrosión localizada; depósitos.",
    "V": "MIC, erosión, SCC Cl⁻ según material, O₂ y flujo.",
    "D": "Agrietamiento por aminas: NA si no se mezcla amina.",
    "J": "Cloruros de formación desde año 8; pH y contaminantes pendientes."
  },
  "C05-R": {
    "P": "Corrosión por amina/gas ácido; amine cracking; erosión-corrosión local.",
    "V": "SSC/HIC, depósitos, cloruros y galvánica según química.",
    "D": "No descartar galvánica solo por relación de áreas.",
    "J": "La rica transporta gases ácidos; requiere API RP 945 y química de la amina."
  },
  "C05-P": {
    "P": "Agrietamiento por amina, corrosión química en puntos calientes.",
    "V": "SCC Cl⁻ en 316L, depósitos, cavitación, SSC/HIC residual.",
    "D": "No descartar SSC/HIC sin medir H₂S y fase acuosa.",
    "J": "Concentración y calentamiento distintos de la amina rica."
  },
  "C06": {
    "P": "Corrosión/SSC/HIC con condensado acuoso ácido.",
    "V": "Depósitos, erosión, baja T por alivio; TLC si el gas condensa en la parte superior de la línea.",
    "D": "Agrietamiento por aminas: NA en gas sin solución.",
    "J": "Identificar enfriamiento y condensación de la línea de gas ácido."
  },
  "C07": {
    "P": "CO₂/SSC/HIC si condensa agua.",
    "V": "Arrastre de amina, erosión, cloruros y MIC; TLC si el gas condensa.",
    "D": "Agrietamiento por aminas solo en contacto relevante con solución.",
    "J": "Gas endulzado sigue húmedo antes de TEG; no descartes sin valores residuales."
  },
  "C08-R": {
    "P": "Corrosión por TEG contaminado, depósitos.",
    "V": "SSC/HIC y cloruros si retiene H₂S/salmuera; erosión.",
    "D": "Agrietamiento por aminas: NA sin amina.",
    "J": "TEG rico contiene más agua; la baja velocidad supuesta no demuestra descarte de erosión."
  },
  "C08-P": {
    "P": "Degradación térmica/química del TEG; corrosión en zonas calientes.",
    "V": "Cloruros/SCC 316L, depósitos, SSC/HIC si contaminado.",
    "D": "Agrietamiento por aminas: NA sin amina.",
    "J": "Control de T de película, pH y contaminantes."
  },
  "C09-V": {
    "P": "CO₂/H₂S húmedo si condensa agua.",
    "V": "Depósitos, erosión, SSC/HIC, corrosión externa; TLC si el gas condensa.",
    "D": "Agrietamiento por aminas: NA salvo contaminación.",
    "J": "Vapor y drenaje NO se evalúan como una sola fase."
  },
  "C09-D": {
    "P": "CO₂/H₂S acuoso y depósitos en ramales contaminados.",
    "V": "MIC, cloruros y corrosión galvánica según mezcla.",
    "D": "No descartar sin analizar cada ramal.",
    "J": "Definir segregación, pendientes, sellos y destino B3."
  },
  "C10": {
    "P": "Bajo riesgo acuoso solo si se demuestra seco en todo régimen.",
    "V": "Condensación en enfriador, erosión, SSC/HIC residual, baja T; TLC si el gas condensa.",
    "D": "CO₂/SSC/HIC descartables solo con ausencia demostrada de agua.",
    "J": "Punto de rocío, H₂S residual."
  },
  "C13-W": {
    "P": "Picadura/rendija, MIC, biofouling, corrosión por O₂.",
    "V": "Galvánica, SCC Cl⁻ por material, erosión, depósitos.",
    "D": "SSC/HIC por gas agrio: NA salvo contaminación cruzada.",
    "J": "Agua de mar clorada: requiere cloro residual y temperatura B3."
  },
  "MC": {
    "P": "Por definir con B3 (vapor: corrosión por condensado/O₂; aceite térmico: degradación).",
    "V": "Química del medio, T de película.",
    "D": "—",
    "J": "Medio de calentamiento no definido en el informe."
  },
  "EXT": {
    "P": "Corrosión atmosférica marina; CUI en equipos y líneas calientes aislados (rehervidores, regeneradores, líneas de amina y TEG).",
    "V": "SCC por cloruros externo en inoxidables calientes; galvánica en soportes y tornillería.",
    "D": "No descartar CUI en inoxidable 316L caliente bajo aislamiento.",
    "J": "El escenario fija ambiente marino; la exposición se evalúa por equipo y ubicación."
  }
};
