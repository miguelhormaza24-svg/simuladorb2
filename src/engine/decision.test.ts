import { describe, expect, it } from 'vitest';
import { CRITERIOS, valoresCriterio } from '../data/criterios';
import { CORRIENTES } from '../data/corrientes';
import { EQUIPOS } from '../data/equipos';
import { entradaDePieza, evaluarHumedad, evaluarPieza, type EntradaPieza, type ResultadoPieza } from './evaluarPieza';
import { monteCarlo, muestrear, mulberry32, percentil, probabilidades, tornado } from './incertidumbre';
import { topsis } from './topsis';

const cv = valoresCriterio();
const entrada = (eq: string, pz: string, cambios: Partial<EntradaPieza> = {}): EntradaPieza => {
  const e = EQUIPOS.find((x) => x.id === eq)!;
  return entradaDePieza(e, e.piezas.find((p) => p.id === pz)!, CORRIENTES, cambios);
};
const ev = (eq: string, pz: string, cambios: Partial<EntradaPieza> = {}): ResultadoPieza => evaluarPieza(entrada(eq, pz, cambios), cv);
const mat = (r: ResultadoPieza, id: string) => r.materiales.find((m) => m.id === id)!;
const reglas = (r: ResultadoPieza, id: string, tipo = 'exclusion') => mat(r, id).hallazgos.filter((h) => h.tipo === tipo).map((h) => h.regla);

describe('modelo 13 · TOPSIS', () => {
  it('la alternativa dominante obtiene 1 y la dominada 0', () => {
    const r = topsis([[9, 1, 9], [5, 5, 5], [1, 9, 1]], [45, 40, 15], [true, false, true]);
    expect(r.cercania[0]).toBeCloseTo(1, 10);
    expect(r.cercania[2]).toBeCloseTo(0, 10);
    expect(r.orden).toEqual([0, 1, 2]);
  });
  it('los pesos cambian el orden', () => {
    const m = [[9, 15, 5], [6, 1, 10]];
    expect(topsis(m, [100, 0, 0], [true, false, true]).orden[0]).toBe(0);
    expect(topsis(m, [0, 100, 0], [true, false, true]).orden[0]).toBe(1);
  });
  it('casos límite: sin alternativas, una sola y pesos nulos', () => {
    expect(topsis([], [1, 1], [true, true])).toEqual({ cercania: [], orden: [] });
    expect(topsis([[5, 2]], [1, 1], [true, false]).cercania).toEqual([1]);
    expect(topsis([[0, 0], [0, 0]], [0, 0], [true, true]).cercania).toEqual([1, 1]);
  });
});

describe('modelo 14 · incertidumbre', () => {
  it('el generador con semilla es reproducible y uniforme en [0, 1)', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const xs = Array.from({ length: 2000 }, () => a());
    expect(xs.slice(0, 5)).toEqual(Array.from({ length: 5 }, () => b()));
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...xs)).toBeLessThan(1);
    expect(xs.reduce((s, x) => s + x, 0) / xs.length).toBeCloseTo(0.5, 1);
  });
  it('muestrea cada distribución dentro de sus límites', () => {
    const rnd = mulberry32(7);
    const n = 3000;
    const serie = (d: Parameters<typeof muestrear>[0]) => Array.from({ length: n }, () => muestrear(d, rnd));
    expect(muestrear({ tipo: 'fijo', v: 3 }, rnd)).toBe(3);
    const u = serie({ tipo: 'uniforme', min: 40, max: 60 });
    expect(Math.min(...u)).toBeGreaterThanOrEqual(40);
    expect(Math.max(...u)).toBeLessThanOrEqual(60);
    const t = serie({ tipo: 'triangular', min: 90, moda: 95, max: 120 });
    expect(Math.min(...t)).toBeGreaterThanOrEqual(90);
    expect(Math.max(...t)).toBeLessThanOrEqual(120);
    expect(t.reduce((s, x) => s + x, 0) / n).toBeCloseTo((90 + 95 + 120) / 3, 0);
    expect(muestrear({ tipo: 'triangular', min: 5, moda: 5, max: 5 }, rnd)).toBe(5);
    const g = serie({ tipo: 'normal', media: 3.9, desv: 0.2, min: 3.5, max: 4.3 });
    expect(Math.min(...g)).toBeGreaterThanOrEqual(3.5);
    expect(Math.max(...g)).toBeLessThanOrEqual(4.3);
    expect(percentil(serie({ tipo: 'normal', media: 10, desv: 1 }), 50)).toBeCloseTo(10, 0);
  });
  it('percentiles y probabilidades', () => {
    expect(percentil([1, 2, 3, 4, 5], 50)).toBe(3);
    expect(percentil([1, 2, 3, 4], 50)).toBe(2.5);
    expect(percentil([1, 2, 3], 0)).toBe(1);
    expect(percentil([1, 2, 3], 100)).toBe(3);
    expect(percentil([], 50)).toBeNaN();
    expect(probabilidades([{ a: true, b: false }, { a: true, b: true }, { a: false, b: false }, { a: true, b: false }])).toEqual({ a: 0.75, b: 0.25 });
  });
  it('tornado ordena las variables por amplitud', () => {
    const t = tornado({ x: 1, y: 1, z: 1 }, { x: [0, 2], y: [0.9, 1.1], z: [-5, 5] }, (v) => 2 * v.x + 10 * v.y + v.z);
    expect(t.map((b) => b.variable)).toEqual(['z', 'x', 'y']);
    expect(t[0]).toMatchObject({ bajo: 7, alto: 17, base: 13, amplitud: 10 });
  });
  it('Monte Carlo sobre el separador: probabilidad de que cada material sea viable', () => {
    const base = entrada('E1-SEP', 'virola', { inhibidor: 99 });
    const modelo = (x: { P: number; T: number; inhibidor: number }) => {
      const r = evaluarPieza({ ...base, ...x }, cv);
      return Object.fromEntries(r.materiales.map((m) => [m.id, m.viable]));
    };
    const dists = {
      P: { tipo: 'triangular' as const, min: 40, moda: 50, max: 60 },
      T: { tipo: 'triangular' as const, min: 80, moda: 95, max: 110 },
      inhibidor: { tipo: 'uniforme' as const, min: 95, max: 99.5 },
    };
    const p1 = probabilidades(monteCarlo({ P: 50, T: 95, inhibidor: 99 }, dists, modelo, 400, 11));
    const p2 = probabilidades(monteCarlo({ P: 50, T: 95, inhibidor: 99 }, dists, modelo, 400, 11));
    expect(p1).toEqual(p2); // misma semilla, mismo resultado
    expect(p1.cs).toBeGreaterThan(0.05);
    expect(p1.cs).toBeLessThan(0.95);
    expect(p1.cs_c625).toBe(1);
    expect(p1.ss316).toBe(0);
  });
});

describe('evaluación por pieza · reglas de exclusión', () => {
  it('cada exclusión lleva norma y cláusula en todas las piezas del inventario', () => {
    let exclusiones = 0;
    for (const e of EQUIPOS) for (const p of e.piezas) {
      const r = evaluarPieza(entradaDePieza(e, p, CORRIENTES), cv);
      if (p.forma === 'sello') { expect(r.materiales).toEqual([]); expect(r.mejor).toBeNull(); continue; }
      expect(r.materiales.length).toBeGreaterThan(0);
      for (const m of r.materiales) for (const h of m.hallazgos) {
        expect(h.norma.length).toBeGreaterThan(3);
        expect(h.clausula.length).toBeGreaterThan(0);
        if (h.tipo === 'exclusion') exclusiones++;
      }
      expect(r.ranking.every((m) => m.viable && m.enLista && m.cercania != null)).toBe(true);
      expect(r.mecanismos.length).toBeGreaterThan(3);
    }
    expect(exclusiones).toBeGreaterThan(40);
    expect(EQUIPOS).toHaveLength(8);
  });
  it('corriente desconocida: error explícito', () => {
    const e = EQUIPOS[0]!;
    expect(() => entradaDePieza(e, { ...e.piezas[0]!, corriente: 'C99' }, CORRIENTES)).toThrow('Corriente desconocida: C99');
  });
  it('acero al carbono: sobreespesor mayor de 6 mm (ISO 21457 §8.2)', () => {
    const r = ev('E1-REC', 'cuerpo');
    expect(r.corrosion.caRequerido).toBeGreaterThan(200);
    expect(reglas(r, 'cs')).toEqual(['ca_excede']);
    expect(r.corrosion.dispMinima).toBeCloseTo(98.48, 1);
    expect(r.mejor!.id).toBe('cs_c625'); // el clad 316L y el recubrimiento quedan fuera por temperatura
    expect(reglas(r, 'cs_c316')).toEqual(['iso15156_3', 'cl_316']);
    expect(reglas(r, 'cs_coat')).toEqual(['recubrimiento_T']);
  });
  it('acero al carbono en tubos e internos: sin sobreespesor (§7.2.2)', () => {
    const r = ev('E1-REC', 'demister');
    expect(reglas(r, 'cs')).toEqual(['pared_delgada']);
    expect(mat(r, 'cs').hallazgos[1]).toMatchObject({ norma: 'ISO 21457:2010', clausula: '§7.2.2', verificado: true });
    // con CO₂ de traza la pérdida en 25 años no llega a 0,5 mm y el acero al carbono vuelve a ser viable
    const traza = ev('E1-REC', 'demister', { CO2: 0.0001 });
    expect(traza.corrosion.caRequerido).toBeLessThan(0.5);
    expect(mat(traza, 'cs')).toMatchObject({ viable: true, integridad: 7 });
  });
  it('dúplex en C01: pH₂S de 70 kPa supera 10 y 20 kPa (Tabla A.24, sin verificar)', () => {
    const r = ev('E1-REC', 'demister');
    expect(reglas(r, 'dss22')).toEqual(['iso15156_3']);
    expect(reglas(r, 'dss25')).toEqual(['iso15156_3']);
    expect(reglas(r, 'mo6')).toEqual(['iso15156_3']); // Cl⁻ de 28 000 mg/L a 120 °C
    expect(r.ranking.map((m) => m.id)).toEqual(['a625']);
  });
  it('tipo 316 con cloruros sobre 60 °C sin H₂S (Tabla 9 nota a y §6.2.2.6)', () => {
    const r = ev('E1-REC', 'demister', { H2S: 0, Cl: 1000 });
    expect(r.ssc.agrio).toBe(false);
    expect(reglas(r, 'ss316')).toEqual(['cl_316']);
    expect(reglas(ev('E1-REC', 'demister', { H2S: 0, Cl: 100 }), 'ss316', 'aviso')).toEqual(['cl_316']);
    expect(mat(ev('E1-REC', 'demister', { H2S: 0, Cl: 1000, T: 50, Tmax: 55 }), 'ss316').viable).toBe(true);
  });
  it('recubrimiento interno: viable bajo 90 °C, con requisitos y aviso galvánico', () => {
    const r = ev('E1-SEP', 'virola', { T: 70, Tmax: 80 });
    expect(mat(r, 'cs_coat').viable).toBe(true);
    expect(reglas(r, 'cs_coat', 'requisito')).toContain('recubrimiento');
    expect(reglas(r, 'cs_coat', 'aviso')).toContain('recubrimiento_galvanica');
    expect(mat(r, 'cs_coat').costoCicloVida).toBe(2);
  });
  it('el inhibidor agrega costo de ciclo de vida y un requisito; el sobreespesor del inventario se compara', () => {
    const r = ev('E1-SEP', 'virola', { inhibidor: 99 });
    expect(mat(r, 'cs').costoCicloVida).toBe(1.5);
    expect(reglas(r, 'cs', 'requisito')).toEqual(['cs_agrio', 'sobreespesor', 'inhibicion']);
    expect(reglas(r, 'cs', 'aviso')).toEqual(['ca_inventario']); // el inventario propone 3 mm y hacen falta 4,8
    expect(r.mecanica).toMatchObject({ cumple: true, tRequerido_mm: expect.closeTo(39.33, 1) });
    expect(r.mejor!.id).toBe('cs');
  });
  it('lado de agua de mar: 316L no figura en la Tabla 10; 25Cr y 6Mo exceden 20 °C', () => {
    const r = ev('E2-REG', 'cond');
    expect(reglas(r, 'ss316')).toContain('agua_mar_no_listado');
    expect(reglas(r, 'dss25')).toContain('agua_mar_T');
    expect(reglas(r, 'cuni')).toEqual(['cuni_proceso']);
    expect(reglas(r, 'ti2', 'requisito')).toEqual(['iso15156_3', 'agua_mar']);
    const frio = ev('E2-REG', 'cond', { servicio: { id: 'C13-W', tipo: 'agua_mar', Tmax: 18, cloroResidual: 1 } });
    expect(reglas(frio, 'dss25')).toContain('agua_mar_T'); // cloro residual > 0,7 mg/L
    expect(reglas(frio, 'mo6')).toEqual([]);
  });
  it('inoxidable sólido en atmósfera marina (Tabla 3)', () => {
    const base = { H2S: 0, Cl: 0, inhibidor: 99 };
    const r = ev('E1-SEP', 'virola', base);
    expect(reglas(r, 'ss316')).toEqual(['atm_marina']);
    expect(reglas(r, 'dss22')).toEqual(['atm_marina']); // 120 °C supera el límite superior de 100 °C
    const tibio = ev('E1-SEP', 'virola', { ...base, T: 85, Tmax: 95 });
    expect(reglas(tibio, 'dss22')).toEqual([]);
    expect(reglas(tibio, 'dss22', 'aviso')).toContain('atm_marina');
    expect(mat(tibio, 'cs_c316').viable).toBe(true); // el clad no expone inoxidable al exterior
    expect(reglas(ev('E1-SEP', 'virola', { ...base, aislado: true }), 'cs', 'aviso')).toContain('cui');
  });
  it('amina rica: PWHT, severidad y límites de ISO 15156-3 opcionales', () => {
    const r = ev('E2-ABS', 'cuerpo');
    expect(r.amina).toMatchObject({ n: 0, nivel: 'baja' });
    expect(reglas(r, 'cs', 'requisito')).toEqual(['cs_agrio', 'ascc_amina', 'sobreespesor']);
    expect(mat(r, 'cs').hallazgos.find((h) => h.regla === 'ascc_amina')).toMatchObject({ clausula: '§6.2.2.5', verificado: true });
    expect(reglas(r, 'cs_coat')).toEqual(['recubrimiento_servicio']);
    expect(reglas(r, 'cs_c316', 'aviso')).toContain('iso15156_3_solucion');
    expect(r.mejor!.id).toBe('cs');
    const alta = ev('E2-ABS', 'cuerpo', { T: 100, Tmax: 100, amina: { tipo: 'MDEA', conc: 45, carga: 0.5, vel: 1, hss: 1 } });
    expect(reglas(alta, 'cs')).toEqual(['amina_severidad']);
    const mod = ev('E2-ABS', 'cuerpo', { T: 95, Tmax: 95 });
    expect(mat(mod, 'cs')).toMatchObject({ viable: true, integridad: 5.5 });
    const estricto = ev('E2-REG', 'bandejas', { aplicar15156EnSolucion: true });
    expect(reglas(estricto, 'ss316')).toEqual(['iso15156_3']);
    expect(mat(ev('E2-REG', 'bandejas'), 'ss316').viable).toBe(true);
  });
  it('amina en pared delgada y sin dato de amina', () => {
    expect(mat(ev('E2-HX', 'tubos'), 'cs')).toMatchObject({ viable: false });
    expect(reglas(ev('E2-HX', 'tubos'), 'cs')).toEqual(['amina_pared_delgada']);
    const suave = ev('E2-HX', 'tubos', { T: 60, Tmax: 60, amina: undefined });
    expect(mat(suave, 'cs')).toMatchObject({ viable: true, integridad: 4.5 });
    expect(reglas(suave, 'cs', 'aviso')).toContain('amina_pared_delgada');
    expect(reglas(ev('E2-ABS', 'cuerpo', { amina: { tipo: 'DEA', conc: 30, carga: 0.3, vel: 1, hss: 1 }, T: 40, Tmax: 40 }), 'cs', 'requisito')).toContain('ascc_amina');
  });
  it('TEG: temperatura de película sobre 204 °C', () => {
    const tubos = ev('E3-REG', 'reh_tubos');
    expect(tubos.teg).toMatchObject({ n: 1 });
    expect(reglas(tubos, 'cs')).toEqual(['teg_pared_delgada']);
    expect(tubos.mejor!.id).toBe('ss316');
    const carcasa = ev('E3-REG', 'reh_carc');
    expect(mat(carcasa, 'cs')).toMatchObject({ viable: true, integridad: 5.5 });
    expect(reglas(carcasa, 'cs_coat')).toEqual(['recubrimiento_servicio']);
    const limpio = { teg: { Tpel: 190, contaminado: 'no' as const } };
    expect(mat(ev('E3-REG', 'reh_carc', limpio), 'cs').integridad).toBe(8.5);
    expect(mat(ev('E3-REG', 'reh_tubos', limpio), 'cs')).toMatchObject({ viable: true, integridad: 4.5 });
    expect(reglas(ev('E3-REG', 'reh_carc', { teg: { Tpel: 215, contaminado: 'si' } }), 'cs')).toEqual(['teg_severidad']);
    expect(ev('E3-REG', 'reh_carc', { teg: undefined }).teg!.n).toBe(0);
  });
  it('gas seco: sin corrosión electroquímica, pero el servicio agrio no se relaja', () => {
    const seco = ev('E3-CON', 'salida');
    expect(seco.humedad.humedo).toBe(false);
    expect(seco.corrosion).toMatchObject({ aplica: false, seco: true, caRequerido: 0 });
    expect(reglas(seco, 'cs', 'requisito')).toEqual(['sobreespesor']);
    expect(seco.materiales.some((m) => m.id === 'cs_coat')).toBe(false); // el recubrimiento solo se ofrece en recipientes
    const agrioSeco = ev('E3-CON', 'salida', { H2S: 0.01 });
    expect(agrioSeco.ssc.agrio).toBe(true);
    expect(reglas(agrioSeco, 'cs', 'requisito')).toContain('agrio_seco');
    expect(agrioSeco.mecanismos.find((m) => m.id === 'ssc')!.estado).toBe('V');
    const sinRocio = ev('E3-CON', 'salida', { rocio: 0 });
    expect(sinRocio.humedad.humedo).toBe(true);
    expect(sinRocio.corrosion.aplica).toBe(true);
  });
  it('humedad: cada estado del agua', () => {
    const b = entrada('E1-SEP', 'virola');
    expect(evaluarHumedad({ ...b, agua: 'no' }, cv).humedo).toBe(false);
    expect(evaluarHumedad({ ...b, agua: 'si' }, cv).humedo).toBe(true);
    expect(evaluarHumedad({ ...b, agua: 'condensa' }, cv).humedo).toBe(true);
    expect(evaluarHumedad({ ...b, tipo: 'gas_seco', agua: 'si' }, cv).humedo).toBe(true);
    expect(evaluarHumedad({ ...b, tipo: 'gas_seco', agua: 'no', rocio: undefined }, cv).humedo).toBe(true);
    const sinAgua = ev('E1-SEP', 'virola', { agua: 'no' });
    expect(sinAgua.corrosion.seco).toBe(true);
    expect(sinAgua.mecanismos.find((m) => m.id === 'co2')!.estado).toBe('D');
  });
  it('mecanismos reclasificados con los datos actuales', () => {
    const est = (r: ResultadoPieza) => Object.fromEntries(r.mecanismos.map((m) => [m.id, m.estado]));
    expect(est(ev('E1-REC', 'cuerpo'))).toMatchObject({ co2: 'P', ssc: 'P', ascc: 'NA', scc_cl: 'P', erosion: 'V', mic: 'V', externa: 'P', cui: 'V' });
    expect(est(ev('E3-CON', 'cuerpo'))).toMatchObject({ co2: 'P', ssc: 'D', tlc: 'V', scc_cl: 'V' });
    expect(est(ev('E2-ABS', 'cuerpo'))).toMatchObject({ co2: 'NA', ssc: 'P', ascc: 'P', amina: 'V' });
    expect(est(ev('E2-ABS', 'cuerpo', { T: 95, Tmax: 95, aislado: true }))).toMatchObject({ amina: 'P', cui: 'P' });
    expect(est(ev('E3-REG', 'reh_tubos'))).toMatchObject({ teg: 'P' });
    expect(est(ev('E3-REG', 'reh_tubos', { teg: { Tpel: 190, contaminado: 'no' } }))).toMatchObject({ teg: 'V' });
    expect(est(ev('E2-REG', 'cond'))).toMatchObject({ agua_mar: 'P', tlc: 'V' });
    expect(est(ev('E1-REC', 'cuerpo', { CO2: 0, Cl: 100, Tmax: 95 }))).toMatchObject({ co2: 'D', scc_cl: 'V' });
    expect(est(ev('E1-REC', 'cuerpo', { tipo: 'agua_mar', H2S: 0 }))).toMatchObject({ co2: 'NA', ssc: 'NA', agua_mar: 'P' });
  });
  it('opciones del modelo: película, pH corregido, pH calculado, dWM 1995 y MEG', () => {
    const base = ev('E1-SEP', 'virola');
    expect(ev('E1-SEP', 'virola', { conPelicula: false }).corrosion.crBase).toBeCloseTo(12.6, 1);
    expect(ev('E1-SEP', 'virola', { corregirPH: true }).corrosion.crBase).toBeGreaterThan(base.corrosion.crBase);
    expect(ev('E1-SEP', 'virola', { wAgua: 50 }).corrosion.crBase).toBeCloseTo(base.corrosion.crBase * 0.33, 1);
    expect(base.corrosion.dwm95).toBeUndefined();
    const flujo = ev('E1-SEP', 'virola', { U: 2, dHidraulico: 0.05, corregirPH: true });
    expect(flujo.corrosion.dwm95!.v).toBeGreaterThan(0);
    expect(base.ph.usado).toBe(3.9);
    const calc = ev('E1-SEP', 'virola', { usarPHCalculado: true });
    expect(calc.ph.usado).toBeCloseTo(calc.ph.calculado, 10);
    expect(Math.abs(calc.ph.diferencia)).toBeLessThan(0.3);
    expect(ev('E2-ABS', 'cuerpo', { usarPHCalculado: true }).ph.usado).toBe(9); // en amina se conserva el pH ingresado
  });
  it('referencia API 6A y verificación de espesor', () => {
    const r = ev('E1-REC', 'cuerpo');
    expect(r.api6a.clase).toBe('HH');
    expect(r.regimen.clave).toBe('h2s');
    expect(r.mecanica!.cumple).toBe(false); // sin inhibidor el sobreespesor no cabe en 35 mm
    expect(ev('E1-REC', 'demister').mecanica).toBeUndefined();
    expect(ev('E3-CON', 'cuerpo').api6a.clase).toBe('AA');
  });
});

describe('criterios · trazabilidad de las fuentes', () => {
  it('todo criterio verificado cita una norma adjunta con página', () => {
    const lista = Object.values(CRITERIOS);
    expect(lista.length).toBeGreaterThan(35);
    for (const c of lista) {
      expect(c.norma.length).toBeGreaterThan(3);
      expect(c.clausula.length).toBeGreaterThan(0);
      expect(Number.isFinite(c.valor)).toBe(true);
      if (c.verificado) { expect(c.estado).toBe('adjunta'); expect(c.pagina).not.toBeNull(); }
      else expect(c.estado).not.toBe('adjunta');
    }
  });
  it('solo se pueden sobrescribir criterios editables y con valores finitos', () => {
    const v = valoresCriterio({ cr_inhibida: 0.05, ssc_umbral_pH2S: 5, ca_severo: NaN, inventado: 1 });
    expect(v.cr_inhibida).toBe(0.05);
    expect(v.ssc_umbral_pH2S).toBe(0.3);
    expect(v.ca_severo).toBe(6);
    expect(v.inventado).toBeUndefined();
  });
});
