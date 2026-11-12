# Metodología del motor de cálculo

Simulador académico. No declara cumplimiento de ISO 15156 ni reemplaza cálculos
certificados. Todo valor de norma vive en `src/data/criterios.ts` con su
cláusula, página y la marca `verificado`.

Unidades: presión en bar absolutos, temperatura en °C (K dentro de las
ecuaciones), velocidad de corrosión en mm/a, logaritmos en base 10.

## 1. Presiones parciales y fugacidad (`presiones.ts`)

- pH₂S = y(H₂S) · P y pCO₂ = y(CO₂) · P, en kPa, bar, MPa y psia.
- Coeficiente de fugacidad del CO₂: log φ = (0,0031 − 1,4/T) · P.
- **Fuente:** ISO 21457 §6.2.3.2 pide usar la presión parcial en la fase gas
  (verificado). La ecuación de φ es de de Waard, Lotz y Milliams (1991), no
  adjunta.
- **Limitación:** la presión se acota a 250 bar. A 320 bar el resultado se marca
  fuera de rango.

## 2. pH in situ (`ph.ts`)

Balance de electroneutralidad resuelto por bisección:

[H⁺] + Alc = [HCO₃⁻] + 2[CO₃²⁻] + [HS⁻] + [OH⁻]

con [CO₂(ac)] = K_H · fCO₂, [H₂S(ac)] = K_H,H₂S · pH₂S y Alc igual al bicarbonato
ingresado.

- **Fuente:** constantes de Plummer y Busenberg (1982), Suleimenov y Krupp
  (1994) y Kharaka et al. (1988). Sustituye al Anexo D de ISO 15156-2, que no
  está en el PDF adjunto. Las pruebas comprueban los valores conocidos a 25 °C.
- **Limitaciones:** solución ideal, así que el Cl⁻ no cambia el pH; sin ácidos
  orgánicos ni hierro disuelto. El resultado se compara con el pH ingresado y
  no lo reemplaza, salvo que el usuario lo pida.

## 3. Severidad SSC (`ssc.ts`)

Regiones 0 a 3 de la Figura 1 de ISO 15156-2:2015 (pág. 9, verificado). La
digitalización está documentada en `docs/validacion.md`. Un punto sobre una
frontera pasa a la región más severa.

## 4. Corrosión por CO₂ (`co2.ts`)

**de Waard, Lotz y Milliams (1991):**

- log V = 5,8 − 1710/T + 0,67 · log fCO₂
- Película: log F = 2400/T − 0,6 · log fCO₂ − 6,7, con máximo de 1
- Glicol: log F = 1,6 · (log W − 2), con W en % de agua
- pH: log F = 0,32 · (pHsat − pH) si pH < pHsat; −0,13 · (pH − pHsat)^1,6 si es
  mayor. pHsat es el menor entre 1,36 + 1307/T − 0,17 · log fCO₂ y
  5,4 − 0,66 · log fCO₂.

**de Waard, Lotz y Dugstad (1995):** 1/V = 1/Vr + 1/Vm, con
log Vr = 4,93 − 1119/T + 0,58 · log fCO₂ − 0,34 · (pH − pH_CO₂) y
Vm = 2,45 · U^0,8 / d^0,2 · fCO₂.

- **Fuente:** literatura, no adjunta. Las constantes de 1991 reproducen los
  valores de control.
- **Régimen H₂S/CO₂:** pCO₂/pH₂S menor de 20, domina el H₂S; mayor de 500,
  domina el CO₂ (Pots et al., 2002). En C01 la razón es 1,3: el modelo de CO₂
  tiende a sobrestimar la pérdida general y no predice la picadura
  (ISO 21457 §6.2.2.2).
- **Limitaciones:** la corrección por pH y el modelo de 1995 son opcionales; el
  de 1995 necesita velocidad y diámetro, que el informe no da. NORSOK M-506 no
  está adjunta y no se implementa.

## 5. Inhibición (`inhibicion.ts`)

V efectiva = A · V inhibida + (1 − A) · V sin inhibir, con V inhibida de
0,1 mm/a (ISO 21457 §8.1 Nota 1, pág. 26, verificado). La disponibilidad mínima
se despeja de CA máx = vida · V efectiva.

## 6. Sobreespesor (`inhibicion.ts`)

Clases de ISO 21457 §8.2 (pág. 26): hasta 1,5 mm no corrosivo, 3 mm leve, 6 mm
severo; sobre 6 mm el acero al carbono se excluye. Tubos e internos no llevan
sobreespesor (§7.2.2, pág. 17); el grupo admite 0,5 mm de pérdida.

## 7. CRA (`cra.ts`)

- **PREN** = Cr + 3,3 · (Mo + 0,5 · W) + 16 · N (ISO 21457 Ec. 1, pág. 4). Se
  calcula con los extremos de la Tabla C.1 de ISO 21457.
- **Límites ambientales de ISO 15156-3:** filas de T, pH₂S, Cl⁻ y pH por
  familia. **Sin verificar**: el Anexo A no está en el PDF.
- **Agua de mar clorada:** Tabla 10 (pág. 22). **Atmósfera marina:** Tabla 3
  (pág. 14); entre el límite inferior y el superior es un aviso, sobre el
  superior es exclusión. **CUI:** §6.6.5, solo aviso.
- **Limitación:** en amina y TEG los límites de ISO 15156-3 no se aplican por
  defecto; el usuario puede activarlos.

## 8. Aminas y 9. TEG (`soluciones.ts`)

ISO 21457 da criterios cualitativos: agrietamiento alcalino (§6.2.2.5) y
materiales para glicol (§7.4.4 y Tabla 11). La severidad cuenta los factores
que superan umbrales de literatura, todos editables y sin verificar: 90 °C,
0,45 mol/mol, 1,5 m/s y 2 % de sales termoestables en amina; 204 °C de película
y pH 6 en TEG.

## 10. Mecánica (`mecanica.ts`)

- t = P · R / (S · E − 0,6 · P) (ASME VIII-1 UG-27), con S = 138 MPa y E = 1
  editables.
- Ve = 1,22 · C / √ρ en m/s (API RP 14E), con C = 100 editable.
- **Limitación:** normas no adjuntas. Sin caudales no hay velocidad en
  boquillas; la función existe y está probada.

## 11. Sellos (`elastomeros.ts`)

- **Elastómeros, ISO 23936-2:2011 (completa, verificado):** Tabla C.1 (pág. 41),
  riesgo de RGD de la Tabla F.1 (pág. 63), plan de envejecimiento del Anexo A
  con las clases de la Tabla A.6 (pág. 19), ensayo RGD del Anexo B y aceptación
  de calificación ≤ 3 (§7.3.2, pág. 9).
- **Termoplásticos:** ISO 23936-1:2022 llegó como vista previa sin límites de
  temperatura. Se usan PE, PP, PVC y GRP de ISO 21457 Tablas 9 y 10; PTFE,
  PEEK, PVDF y PA quedan pendientes.

## 12. API 6A (`api6a.ts`)

Referencia comparativa, de memoria y sin verificar: clases de material AA a HH,
corrosividad por pCO₂ (0,05 y 0,21 MPa) y fluido de ensayo de sellos. Las clases
de temperatura se toman de la Tabla A.6 de ISO 23936-2.

## 13. Selección multicriterio (`evaluarPieza.ts`, `topsis.ts`)

1. **Filtro de viabilidad.** Cada exclusión lleva regla, motivo, norma,
   cláusula y `verificado`.
2. **TOPSIS** sobre integridad, costo de ciclo de vida y fabricabilidad, con
   pesos 45/40/15 editables.

**Limitación:** los tres índices son didácticos. La integridad va de 0 a 10
según la clase de sobreespesor o el margen frente al límite de ISO 15156-3.

## 14. Incertidumbre (`incertidumbre.ts`)

Tornado de una variable a la vez y Monte Carlo con distribuciones uniforme,
triangular y normal truncada. El generador mulberry32 lleva semilla.

## Mecanismos de daño

La Tabla 22 del informe se reclasifica por pieza en potencial, por verificar,
descarte condicionado o no aplica, según los datos actuales.
