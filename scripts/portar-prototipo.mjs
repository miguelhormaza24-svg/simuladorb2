// Porta los datos del prototipo v1 (prototipo/index.html) a src/data/*.ts.
// Se ejecutó una vez; se conserva para dejar trazabilidad del origen de los datos.
import { readFileSync, writeFileSync } from 'node:fs';

const html = readFileSync('prototipo/index.html', 'utf8').split('\n');
const ini = html.findIndex((l) => l.startsWith('const ESCENARIO'));
const fin = html.findIndex((l) => l.startsWith('const PENDIENTES'));
const src = html.slice(ini, fin).join('\n');
const d = new Function(`${src}; return { ESCENARIO, STREAMS, MECH, EQUIPOS, PIPE_ID };`)();

const dato = ([v, o]) => ({ v, o });
const corrientes = {};
for (const [id, s] of Object.entries(d.STREAMS)) {
  const c = { id, nombre: s.nombre, fase: s.fase, tipo: s.tipo, color: s.color };
  for (const k of ['P', 'T', 'Tmax', 'Tmin', 'H2S', 'CO2', 'agua', 'pH', 'Cl']) c[k] = dato(s[k]);
  c.HCO3 = { v: 0, o: 'P' };
  if (s.wAgua) c.wAgua = dato(s.wAgua);
  if (s.rocio) c.rocio = dato(s.rocio);
  if (s.amina) c.amina = s.amina;
  if (s.teg) c.teg = s.teg;
  c.nota = s.nota;
  c.material = s.material;
  corrientes[id] = c;
}
const cab = '// Generado por scripts/portar-prototipo.mjs a partir del prototipo v1 y del informe B2.\n';
const j = (x) => JSON.stringify(x, null, 2);
writeFileSync('src/data/corrientes.ts',
  `${cab}// Tabla 20 del informe B2. Cada valor numérico lleva su origen (D, I, S, P).\nimport type { Corriente } from './tipos';\n\nexport const CORRIENTES: Record<string, Corriente> = ${j(corrientes)};\n`);
writeFileSync('src/data/equipos.ts',
  `${cab}// Tablas 8 a 12 del informe B2: los ocho equipos del alcance y sus piezas.\nimport type { Equipo } from './tipos';\n\nexport const EQUIPOS: Equipo[] = ${j(d.EQUIPOS)};\n\n/** Diámetro interior (mm) por «NPS-Schedule», para velocidades en boquillas. */\nexport const DI_TUBERIA: Record<string, number> = ${j(d.PIPE_ID)};\n`);
writeFileSync('src/data/mecanismos.ts',
  `${cab}// Tabla 22 del informe B2 (matriz de cribado por corriente).\nimport type { MecanismoCorriente } from './tipos';\n\nexport const MECANISMOS: Record<string, MecanismoCorriente> = ${j(d.MECH)};\n`);
writeFileSync('src/data/escenario.ts',
  `${cab}// Tabla 3 del informe B2: base de diseño del escenario B.\nexport const ESCENARIO: [string, string][] = ${j(d.ESCENARIO)};\n\nexport const VIDA_DISENO_ANOS = 25;\nexport const P_CABEZAL_B1_BAR = 320;\nexport const P_DISENO_PLANTA_BAR = 50;\n`);
console.log('corrientes', Object.keys(corrientes).length, 'equipos', d.EQUIPOS.length);
