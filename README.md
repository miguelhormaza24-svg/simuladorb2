# Simulador de selección de materiales · Planta de gas B2

Proyecto académico de la asignatura Selección de materiales (UIS). Evalúa ocho
equipos de la planta de proceso de gas B2 del Proyecto B, La Guajira.

> Herramienta académica. No declara cumplimiento de ISO 15156 ni reemplaza
> cálculos certificados.

## Estado

| Hito | Estado |
|---|---|
| 1. Plan y datos faltantes | Hecho |
| 2. Motor y pruebas | Hecho |
| 3. Interfaz | Pendiente |
| 4. Reportes y despliegue | Pendiente |

## Cómo correrlo

```bash
npm install
```

```bash
npm test
```

```bash
npm run coverage
```

```bash
npm run validacion
```

## Estructura

- `src/data/criterios.ts`: todos los umbrales y tablas de norma, con cláusula,
  página y `verificado`.
- `src/data/`: corrientes, equipos, materiales y mecanismos del informe B2.
- `src/engine/`: funciones puras de cálculo, sin dependencia de la interfaz.
- `docs/metodologia.md`: ecuaciones, fuentes y limitaciones.
- `docs/validacion.md`: valores de control y resultados.
- `prototipo/index.html`: versión 1.

## Supuestos

| Supuesto | Valor |
|---|---|
| Presión de diseño de planta (S1) | 50 bar; los 320 bar son del cabezal B1 |
| Sobreespesor | vida × [A · 0,1 + (1 − A) · velocidad con película] |
| Punto sobre una frontera de la Figura 1 | Región más severa |
| MEG | Sin crédito (100 % agua) hasta tener su fracción |
| Cloruros | 600 mg/L en agua condensada; 28 000 mg/L desde el año 8 |
| Límites de ISO 15156-3 en amina y TEG | No se aplican por defecto |
| Costo y fabricabilidad | Índices didácticos |

## Pendientes

| Pendiente | Efecto |
|---|---|
| ISO 15156-2 completa (Anexos A, C y D) | Requisitos del acero y pH in situ sin verificar |
| ISO 15156-3 completa (Anexo A) | Límites de CRA sin verificar |
| ISO 23936-1 completa | Sin límites para PTFE, PEEK, PVDF y PA |
| API 6A | Tablas de memoria, sin verificar |
| NORSOK M-506 | Segundo modelo de CO₂ no implementado |
| Caudales por fase | Sin velocidad en boquillas ni dWM 1995 |
| Química de amina y TEG, residuales de C07 y C10, datos de C13-W | Valores supuestos |
