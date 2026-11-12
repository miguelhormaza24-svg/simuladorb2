# Informe de validación · motor de cálculo

Se reproduce con `npm run validacion` (archivo `src/engine/validacion.test.ts`).
La suite completa tiene 108 pruebas y cubre el 100 % de las líneas y funciones
de `src/engine/` (99,8 % de sentencias, 99,1 % de ramas).

## Valores de control

| # | Control pedido | Resultado del motor | Estado |
|---|---|---|---|
| C1 | dWM a 95 °C, 50 bar y pCO₂ 0,9 bar: ≈ 12,6 mm/a sin película y ≈ 9,3 mm/a con película | φ = 0,9223; fCO₂ = 0,830 bar; 12,62 mm/a sin película; factor de película 0,737; 9,30 mm/a con película | Cumple |
| C2 | pH₂S de C01 a 50 bar = 70 kPa: servicio agrio | 70,00 kPa; con pH 3,9 cae en la región 3 | Cumple |
| C3 | C07 con 4 ppmv de H₂S: 0,02 kPa, región 0 | 0,0200 kPa; región 0 | Cumple |
| C4 | 316L con Tmáx de 120 °C en servicio agrio: excluido por ISO 15156-3 | Excluido por la regla `iso15156_3` (Tabla A.2: 60 °C y 100 kPa) | Cumple, **con fuente sin verificar** |
| C5 | Tubos de condensador con C13-W a 45 °C: solo titanio Gr 2 es viable (Tabla 10) | Único viable de la lista del inventario: titanio Gr 2. 6Mo y 25Cr quedan fuera por el límite de 20 °C y Alloy 625 por el de 30 °C | Cumple, **con una salvedad** |
| C6 | Separador con 99 % de disponibilidad: CA ≈ 4,8 mm, acero al carbono viable con 6 mm | Velocidad efectiva 0,192 mm/a; CA = 4,80 mm; clase «severamente corrosivo», 6 mm; acero al carbono viable | Cumple |

### Salvedades

- **C4.** El PDF adjunto de ISO 15156-3 es una vista previa que termina en la
  pág. 9 y no trae el Anexo A. El límite de 60 °C y 100 kPa del 316L está
  cargado con `verificado: false`. La prueba pasa, pero la cláusula no se pudo
  leer.
- **C5.** La Tabla 10 de ISO 21457 (pág. 22) también admite a 45 °C las
  aleaciones C276/C22 (50 °C) y 686/59/C2000 (60 °C). No están en la lista de
  candidatos del inventario; el motor las devuelve aparte, en `fueraDeLista`.
  El CuNi 90/10 (100 °C) queda excluido porque el lado de proceso lleva H₂S.

## Resultados derivados de los controles

| Resultado | Valor |
|---|---|
| Disponibilidad mínima del inhibidor para que el separador en acero al carbono no pase de 6 mm | 98,48 % |
| Espesor por presión del separador (UG-27, 50 bar, Ø 1,8 m, S = 138 MPa, E = 1) | 33,3 mm; con 6 mm de CA, 39,3 mm frente a 45 mm del inventario |
| pH in situ calculado para C01 a 50 bar y 95 °C, agua condensada | 3,97, frente a 3,9 del escenario |
| Fracción de la acidez de C01 que aporta el H₂S | 70 % |
| Ranking TOPSIS del separador con 99 % de inhibidor | Acero al carbono 0,579; acero con overlay Alloy 625 0,421 |

## Figura 1 de ISO 15156-2

La figura del PDF es una imagen ráster de 1393 × 1145 px. La cuadrícula se midió
en píxeles y las fronteras se comprobaron en 14 abscisas: la desviación máxima
fue de 0,002 unidades de pH.

| Frontera | Ecuación |
|---|---|
| Región 0 | pH₂S < 0,3 kPa |
| Entre 1 y 2 | pH = 4,5 + log₁₀(pH₂S) de 0,3 a 100 kPa; pH = 6,5 sobre 100 kPa |
| Entre 2 y 3 | pH = 3,5 de 0,3 a 1 kPa; pH = 3,5 + log₁₀(pH₂S) de 1 a 100 kPa; pH = 5,5 sobre 100 kPa |

La línea vertical está dibujada en ≈ 0,316 kPa, pero el texto y el rótulo dicen
0,3 kPa: se usa 0,3 kPa.

## Pruebas por regla de exclusión

Cada regla tiene al menos una prueba en `src/engine/decision.test.ts`.

| Regla | Fuente | Verificada |
|---|---|---|
| `iso15156_3` | ISO 15156-3, Tablas A.2, A.8 y A.24 | No |
| `ca_excede` | ISO 21457 §8.2 | Sí |
| `pared_delgada`, `amina_pared_delgada`, `teg_pared_delgada` | ISO 21457 §7.2.2 | Sí; la tolerancia de 0,5 mm es del grupo |
| `cl_316` | ISO 21457 Tabla 9 nota a y §6.2.2.6 | Sí; extendida de agua dulce a agua de proceso |
| `agua_mar_no_listado`, `agua_mar_T` | ISO 21457 Tabla 10 | Sí |
| `atm_marina` | ISO 21457 Tabla 3 | Sí |
| `recubrimiento_T`, `recubrimiento_servicio` | Criterio del grupo | No |
| `amina_severidad` | API RP 945 (literatura) | No |
| `teg_severidad` | ISO 21457 §7.4.4 con umbrales de literatura | Parcial |
| `cuni_proceso` | Práctica de selección (literatura) | No |

## Comprobación de la interfaz

Recorrido automático con Chromium sobre el sitio compilado, en 1280 px y 390 px
de ancho.

| Comprobación | Resultado |
|---|---|
| Las diez vistas cargan sin errores de consola | Sí |
| Desborde horizontal de página en 390 px | Ninguno |
| Elegir un equipo del diagrama con el teclado | Sí |
| Condensador del regenerador en el Simulador | Recomienda titanio Gr 2; el 316L del inventario sale excluido |
| Abrir en un navegador limpio la URL de un caso editado | Recupera el valor y lo marca con origen U |
| Recargar sin hash | Recupera el caso desde localStorage |
| Bajar el sobreespesor máximo a 4 mm en Criterios | El separador pasa de acero al carbono a overlay de Alloy 625 |
| Reporte con las 27 piezas | 27 fichas; CSV, JSON y PDF generados |
