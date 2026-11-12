import type { ReactNode } from 'react';
import { useEstado, VISTAS, hashDe } from '../state/store';
import { AVISO_ACADEMICO } from './comunes';
import { Reporte } from './Reporte';
import { Escenarios, Sellos, Simulador } from './vistasCalculo';
import { Corrientes, Criterios, Equipos, Inicio, Mecanismos, Normas } from './vistasDatos';

export function App(): ReactNode {
  const [estado, cambiar] = useEstado();
  const p = { estado, cambiar };
  const vista = {
    inicio: <Inicio {...p} />, equipos: <Equipos {...p} />, corrientes: <Corrientes {...p} />, mecanismos: <Mecanismos {...p} />,
    simulador: <Simulador {...p} />, sellos: <Sellos {...p} />, escenarios: <Escenarios {...p} />, criterios: <Criterios {...p} />,
    normas: <Normas />, reporte: <Reporte {...p} />,
  }[estado.vista];
  return (
    <>
      <a className="saltar" href="#contenido">Saltar al contenido</a>
      <header className="cabecera">
        <div className="cabecera-in">
          <div className="marca">
            <span className="marca-sello" aria-hidden="true">B2</span>
            <div><p className="marca-titulo">Simulador B2</p><p className="marca-sub">Selección de materiales · UIS</p></div>
          </div>
          <nav aria-label="Secciones">
            <ul>
              {VISTAS.map(([id, nombre]) => (
                <li key={id}>
                  <a href={hashDe({ ...estado, vista: id })} aria-current={estado.vista === id ? 'page' : undefined}
                    onClick={(e) => { e.preventDefault(); cambiar({ vista: id }); window.scrollTo(0, 0); }}>{nombre}{id === 'reporte' && estado.reporte.length ? ` (${estado.reporte.length})` : ''}</a>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </header>
      <main id="contenido" tabIndex={-1}>{vista}</main>
      <footer className="pie"><p>{AVISO_ACADEMICO}</p><p>Proyecto B · Planta de proceso de gas B2 · Escuela de Ingeniería Metalúrgica y Ciencia de los Materiales, UIS.</p></footer>
    </>
  );
}
