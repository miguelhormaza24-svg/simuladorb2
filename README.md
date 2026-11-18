# Simulador de selección de materiales · Planta de gas B2

Proyecto académico de la asignatura Selección de materiales (UIS). Evalúa ocho
equipos de la planta de proceso de gas B2 del Proyecto B, La Guajira: recibidor
de líquidos, separador de entrada, absorbedor, regenerador y rehervidor de
aminas, intercambiador rica/pobre, contactor y regenerador de TEG.

> Herramienta académica. No declara cumplimiento de ISO 15156 ni reemplaza
> cálculos certificados.

## Estado

| Hito | Estado |
|---|---|
| 1. Plan y datos faltantes | Hecho |
| 2. Motor y pruebas | Hecho: 108 pruebas, 100 % de líneas de `src/engine/` |
| 3. Interfaz | Hecho: diez vistas |
| 4. Reportes y despliegue | Reportes hechos; el flujo de despliegue está listo y falta publicarlo |

## Cómo correrlo

Requiere Node 22 o posterior.

```bash
npm install
```

```bash
npm run dev
```

Pruebas, cobertura y valores de control:

```bash
npm test
```

```bash
npm run coverage
```

```bash
npm run validacion
```

Compilar y ver el sitio estático:

```bash
npm run build
```

```bash
npm run preview
```

## Versión en un solo archivo HTML

Para unirlo con los simuladores de B1 y B3, o abrirlo sin internet:

```bash
npm run build:html
```

Genera `simulador-b2.html` en la raíz: JavaScript y estilos incrustados, sin
dependencias externas. Se abre con doble clic. Para integrarlo con otros
simuladores, lo más seguro es cargarlo en un `<iframe>`, porque así sus
estilos y su navegación por `#` no chocan con los de las otras páginas.

## Cómo desplegarlo

1. En GitHub, abra Settings → Pages y elija «GitHub Actions» como fuente.
2. Lleve la rama a `main`. El flujo `.github/workflows/deploy.yml` corre las
   pruebas con el umbral de cobertura, compila y publica `dist/`.
3. El sitio queda en `https://<usuario>.github.io/simuladorb2/`.

Si el repositorio cambia de nombre, cambie `base` en `vite.config.ts`.

## Estructura

| Ruta | Contenido |
|---|---|
| `src/data/criterios.ts` | Todos los umbrales y tablas de norma, con cláusula, página y `verificado` |
| `src/data/` | Corrientes, equipos, materiales y mecanismos del informe B2 |
| `src/engine/` | Funciones puras de cálculo, sin dependencia de la interfaz |
| `src/state/` | Estado en el hash de la URL y en localStorage |
| `src/ui/` | Vistas en React y gráficas en SVG propio |
| `src/report/` | Fichas por pieza y exportación a CSV y JSON; el PDF sale por impresión |
| `docs/metodologia.md` | Ecuaciones, fuentes y limitaciones de cada modelo |
| `docs/validacion.md` | Valores de control y resultados |
| `prototipo/index.html` | Versión 1 |

Se eligió React porque las diez vistas comparten formularios y estado
derivado; el motor no lo importa y se prueba solo.

## Origen de los datos

Cada dato de entrada lleva una letra: D (escenario), I (inventario o inferido),
S (supuesto), P (pendiente) o U (usuario). Cada criterio de norma dice si se
leyó en un PDF adjunto («verificado») o no («por verificar»).

## Supuestos

| Supuesto | Valor |
|---|---|
| Presión de diseño de planta (S1) | 50 bar; los 320 bar son del cabezal B1 |
| Sobreespesor | vida × [A · 0,1 + (1 − A) · velocidad con película] |
| Punto sobre una frontera de la Figura 1 | Región más severa |
| MEG | Sin crédito (100 % agua) hasta tener su fracción |
| Cloruros | 600 mg/L en agua condensada; 28 000 mg/L desde el año 8 |
| Límites de ISO 15156-3 en amina y TEG | No se aplican por defecto; opción en el Simulador |
| Tolerancia de pérdida en tubos e internos | 0,5 mm |
| Recubrimiento orgánico interno | Hasta 90 °C |
| Condiciones por equipo (regenerador, amina, TEG, C07, C13-W) | Valores típicos del prototipo, marcados S o P |
| Costo, integridad y fabricabilidad | Índices didácticos |
| Intervalos de incertidumbre | P ±20 %, T ±10 °C, CO₂ y H₂S ±25 %, pH ±0,3, Cl⁻ ±50 % |

## Pendientes

| Pendiente | Efecto |
|---|---|
| ISO 15156-2 completa (Anexos A, C y D) | Requisitos del acero y pH in situ sin verificar |
| ISO 15156-3 completa (Anexo A) | Límites de CRA sin verificar |
| ISO 23936-1 completa | Sin límites para PTFE, PEEK, PVDF y PA |
| API 6A | Tablas de memoria, sin verificar |
| NORSOK M-506 | Segundo modelo de CO₂ no implementado |
| API RP 945, ASME II-D, API RP 14E | Umbrales y fórmulas de literatura |
| Caudales por fase | Sin velocidad en boquillas ni modelo de 1995 con flujo real |
| Presión real de llegada y P/T por equipo | Se usa S1 y valores típicos |
| Química de amina y TEG, residuales de C07 y C10, datos de C13-W | Valores supuestos |
| Publicación en GitHub Pages | Falta acceso de escritura al repositorio |
