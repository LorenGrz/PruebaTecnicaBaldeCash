# 01 · Prompt de UI para Google Stitch

Herramienta: **Google Stitch** (modo Web). Salida: proyecto
*BaldeCash Student Financing App* — un board de design system y 7 pantallas.

**Cómo se usó:** el bloque `DESIGN SYSTEM` se repite textual al principio de cada pantalla,
y las pantallas se generan de a una. El prompt va en inglés porque Stitch responde mejor a
instrucciones en inglés, pero toda la microcopy está fijada en español de Perú.

Los colores salieron de inspeccionar los estilos computados de `baldecash.com`: indigo de
marca `#4654CD`, turquesa de los CTA `#03DBD0`, bordes `#E5E5E5` y los estados en la escala
de Tailwind que ya usa el sitio.

---

````text
DESIGN SYSTEM (use verbatim on every screen)

Product: BaldeCash — laptop financing for university students in Peru.
Language: ALL visible copy in Spanish (Peru). Currency "S/" before the amount.
Style: clean fintech SaaS, light theme only, generous whitespace, no gradients,
no illustrations, no stock photos. Desktop 1440px and mobile 390px.

Colors
  primary  #4654CD  (brand indigo — logo, links, active states, badges)
  accent   #03DBD0  (turquoise — primary CTA background, text on it is #0A0A0A)
  ink      #0A0A0A  (headings)
  muted    #525252  (secondary text, labels)
  border   #E5E5E5  (1px card and input borders)
  surface  #FFFFFF  (cards, soft shadow y=2 blur=8 rgba(0,0,0,.05))
  bg       #FAFAFA  (page background)
  success  #22C55E · warning #F59E0B · danger #EF4444

Type
  Headings: rounded geometric sans, bold. Body/inputs/buttons: neutral grotesque.
  H1 32px · H2 22px · body 15px · label 13px, muted.

Components
  Cards: white, 14px radius, 1px #E5E5E5 border, 24px padding.
  Primary button: #03DBD0 bg, #0A0A0A text, pill radius, 44px tall, bold.
  Secondary button: white bg, #4654CD text, 1px #4654CD border, pill radius.
  Inputs: 44px tall, 10px radius, 1px #E5E5E5 border, focus ring 2px #4654CD.
  Status badges (pill, 12px bold): pendiente = amber tint bg + #F59E0B text,
  aprobada = green tint + #22C55E, rechazada = red tint + #EF4444.
  Header: white bar, 1px bottom border, "BaldeCash" wordmark left
  (Balde in #4654CD, Cash in #03DBD0), user name + role chip right.

────────────────────────────────────────────────────────────
SCREEN 1 — "Ingreso"
Centered 420px card on #FAFAFA, no header.
H1 "Ingresa a tu cuenta", subtitle muted "Usa tu DNI para continuar".
One input: label "DNI", placeholder "8 dígitos", numeric.
Primary button full width: "Continuar".
Show an inline error variant under the input: "Ingresa 8 dígitos numéricos".

SCREEN 2 — "Alta de estudiante" (same card, expanded state)
Info banner in light indigo tint: "No encontramos ese DNI. Completa tus datos
para crear tu cuenta."
DNI input now read-only showing the typed value.
Inputs stacked: "Nombre completo", "Correo electrónico", "Teléfono"
(placeholder "9XXXXXXXX").
Primary button "Crear cuenta y continuar" + text link "Usar otro DNI".

SCREEN 3 — "Nueva solicitud" (student, with header)
H1 "Solicita tu financiamiento", subtitle "Completa tus datos y elige el monto
y el plazo."
Card 1 "Tus datos" — 2x2 grid of filled, editable inputs: Nombre completo, DNI,
Correo electrónico, Teléfono. Small muted hint: "Puedes corregirlos si cambiaron."
Card 2 "Tu financiamiento" — input "Monto a financiar" with "S/" prefix and hint
"Entre S/ 1,000 y S/ 10,000"; a 4-option segmented selector "Plazo" with
6 / 12 / 18 / 24 meses, 12 selected.
Live summary strip inside card 2, indigo tint: "Cuota mensual estimada" left,
large bold "S/ 283.68" right.
Primary button "Enviar solicitud" + muted note "Tasa anual 24%".
Also render a LOADING variant of the button ("Enviando...", spinner, disabled).

SCREEN 4 — "Solicitud enviada" (success)
Centered 520px card. Green check circle, H1 "¡Solicitud enviada!",
muted line "La revisaremos y te avisaremos por correo."
Big metric block: "Cuota mensual" label, "S/ 283.68" in 40px bold.
Three-column summary: Monto S/ 3,000 · Plazo 12 meses · Estado badge "pendiente".
Secondary button "Ver mi solicitud".

SCREEN 5 — "Ya tienes una solicitud" (student returning)
Same layout as screen 3 but the form is replaced by an amber-tinted card:
H2 "Ya enviaste tu solicitud", muted "Enviada el 18/09/2026 · S/ 3,000 a 12 meses",
status badge "pendiente", primary button "Ver el detalle".
Small muted footnote: "Si tu solicitud es rechazada podrás enviar una nueva."

SCREEN 6 — "Solicitudes" (admin list, with header)
H1 "Solicitudes" with muted counter "24 solicitudes".
Filter bar in a white card: an "Estado" dropdown (Todas / pendiente / aprobada /
rechazada) on the left, right side muted "Mostrando 1–10 de 24".
Table, white card, header row #FAFAFA, columns:
Estudiante (name over muted DNI) · Monto · Plazo · Cuota mensual · Estado (badge)
· Fecha · a "Ver" text link in primary color.
10 realistic Peruvian rows (e.g. "Clara Fernández", "Ethel Castillo").
Pagination bottom right: « Anterior · 1 2 3 · Siguiente », current page in primary.
Include an EMPTY-STATE variant: "No hay solicitudes con ese estado."

SCREEN 7 — "Detalle de solicitud" (admin view)
Back link "← Volver a solicitudes".
H1 "Solicitud #A1B2C3" with status badge beside it.
Card "Estudiante": nombre, DNI, correo, teléfono in a 2x2 label/value grid.
Card "Financiamiento": Monto S/ 3,000 · Plazo 12 meses · Tasa anual 24% ·
Cuota mensual S/ 283.68 (this one emphasized, larger).
Sticky action bar at the bottom of the card: primary button "Aprobar"
(green #22C55E bg, white text) and secondary "Rechazar" (danger outline).
Render a second variant of this screen WITHOUT the action bar — that is the
student's read-only view.
````

---

## Ajustes sobre lo generado

- Stitch resolvió la navegación como una **app única con sidebar**. Se adopta, filtrando
  las opciones por rol: el administrador ve solo *Gestión de créditos*; el estudiante ve
  *Mi resumen* y, si no tiene solicitud activa, *Solicitar financiamiento*.
- Las entradas *Laptops disponibles* y *Mis cuotas* que aparecen en el diseño quedan
  **fuera del alcance** de la prueba y no se implementan.
- Las tipografías finales son las que fijó el design system del proyecto de Stitch.
