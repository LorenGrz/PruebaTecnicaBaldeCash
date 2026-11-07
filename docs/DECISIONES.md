# Bitácora de decisiones

Cada entrada sigue el mismo formato: **problema → opciones → elección → por qué**.
Se escribe durante el desarrollo, no al final, para que refleje lo que realmente pasó.

---

## 1. Alcance: ¿cuánta aplicación construir?

**Problema.** El enunciado pide dos endpoints y dos vistas. Yo quería además usuarios,
roles y una vista de detalle, lo que casi duplica el trabajo.

**Opciones.**
1. Solo lo pedido: una tabla, dos endpoints, dos vistas.
2. Usuarios y roles con autenticación real (hash de contraseña + JWT).
3. Usuarios y roles sin autenticación real.

**Elección.** La 3.

**Por qué.** Los roles son lo que le da sentido al producto: el estudiante y el analista
de créditos no ven la misma pantalla, y el detalle de una solicitud no puede ser público.
Pero ninguno de los cinco criterios de evaluación premia la autenticación, y un login a
medias — JWT sin refresh, sin expiración, sin protección de rutas en SSR — habría metido
superficie de error en las dos áreas que más pesan (funcionalidad 30%, calidad 25%).
La identidad se resuelve con un ingreso por DNI que el guard del backend traduce a un
usuario y un rol. Está marcado en el código con `// SIMPLIFICACIÓN:` y es lo primero que
haría distinto con más tiempo.

---

## 2. Dónde vive la lógica de negocio

**Problema.** Las validaciones del enunciado (monto entre 1000 y 10000, plazos 6/12/18/24,
DNI de 8 dígitos, teléfono que empieza en 9) tienen que aplicarse en el backend, pero el
frontend también las necesita: sin ellas el formulario no puede avisar nada hasta que
responde el servidor, ni mostrar la cuota estimada mientras el usuario elige el plazo.

**Opciones.**
1. Validar en el backend con `class-validator` y repetir las reglas a mano en el frontend.
2. Validar solo en el backend y que el frontend muestre únicamente lo que vuelve del 422.
3. Dos clases de dominio (`Usuario` y `Solicitud`) que concentran las reglas, usadas por
   los dos proyectos.

**Elección.** La 3.

**Por qué.** "Qué es una solicitud válida" debe tener una sola definición. Con la opción 1
las reglas se desincronizan al primer cambio; con la 2 el formulario se siente muerto y
cada estimación de cuota es un viaje al servidor. Las clases son puras: no importan Nest,
ni React, ni la base de datos, así que se testean solas y corren igual en los dos lados.
Cada capa aporta solo lo suyo: el DTO de Nest valida formato y tipos con decoradores,
el repositorio se ocupa de unicidad y claves foráneas, y el componente decide cuándo
mostrar el error. El backend nunca confía en la validación del frontend: la repite.

**Qué costó.** Al no usar un workspace de pnpm, las clases están duplicadas en `api/` y
`web/`. Es una copia deliberada — el precio de mantener los dos proyectos independientes
y levantables por separado. Con un monorepo iría en `packages/dominio`.

---

## 3. Qué se guarda en la solicitud

**Problema.** La cuota mensual y la tasa se pueden recalcular en cada lectura a partir del
monto y el plazo. ¿Vale la pena persistirlas?

**Elección.** Se persisten `cuota_mensual` y `tasa_anual` en cada solicitud.

**Por qué.** La tasa es configurable por variable de entorno. Si mañana pasa de 24% a 26%,
una solicitud aprobada el mes pasado tiene que seguir mostrando la cuota con la que fue
aprobada: es el compromiso que se le hizo al estudiante, no un dato derivable del presente.
Guardar la tasa usada convierte a la solicitud en un registro histórico autosuficiente.

Por el mismo motivo los montos son `numeric(10,2)` y no `float`: en punto flotante binario
`0.1 + 0.2 !== 0.3`, y eso en dinero es un bug esperando a que alguien lo encuentre.

---

## 4. Una solicitud activa por estudiante

**Problema.** ¿Qué pasa si un estudiante envía el formulario dos veces?

**Elección.** Un estudiante puede tener una sola solicitud en estado `pendiente` o
`aprobada`. Si la suya fue rechazada, puede enviar una nueva.

**Por qué.** Es la regla del negocio real: no se financian dos laptops en paralelo a la
misma persona, pero un rechazo no puede ser una puerta cerrada para siempre. Se valida en
el backend con un 409, no solo ocultando el formulario en el frontend: el botón escondido
no es una regla de negocio, es una comodidad de la interfaz.

---

## 5. Errores: 422 con detalle por campo

**Problema.** El enunciado pide 422 indicando qué campo falló y por qué, y que los errores
no controlados no expongan trazas.

**Elección.** Una única forma de error en toda la API, con un arreglo `detalles` de
`{ campo, mensaje }`, y un `ExceptionFilter` global que convierte cualquier excepción no
prevista en un 500 genérico con un `requestId`.

**Por qué.** Quien consume la API puede escribir un solo manejador de errores y pintar los
mensajes debajo del campo correspondiente sin adivinar formatos. El `requestId` permite
encontrar el error real en los logs sin filtrarle al cliente el stack trace, el nombre de
la tabla ni la consulta que falló.

---

## 6. Identidad sin contraseña

**Problema.** El producto necesita roles — el estudiante y el analista de créditos no ven lo mismo, y el detalle de una solicitud no puede ser público — pero la prueba se evalúa en 4 horas y ninguno de los cinco criterios premia la autenticación.

**Opciones.**
1. Login real: hash de contraseña, JWT, refresh, protección de rutas en SSR.
2. Un selector "actuar como" en la cabecera.
3. Ingreso por DNI, sin contraseña, con la identidad viajando en un header.

**Elección.** La 3.

**Por qué.** Se navega como una aplicación real — hay una pantalla de ingreso, una sesión y rutas que respetan el rol — sin gastar dos horas en criptografía que después habría que defender a medias. Un JWT sin expiración ni refresh es peor que no tenerlo: aparenta seguridad donde no la hay.

La API recibe la identidad en el header `x-usuario-id` y un guard la resuelve a un usuario con su rol. El archivo está marcado con `// SIMPLIFICACIÓN:` y es lo primero que cambiaría con más tiempo: el guard es exactamente el punto donde entraría la verificación del token, sin tocar nada más.

**Qué costó.** Cualquiera que conozca un id puede hacerse pasar por ese usuario. Es aceptable en una prueba técnica y sería inaceptable en producción; está escrito en el README para que nadie lo descubra leyendo el código.

---

## 7. Una sola aplicación con navegación por rol

**Problema.** El enunciado pide dos vistas: un formulario y un listado. Con dos roles, la pregunta es si son dos aplicaciones, dos rutas sueltas, o una aplicación que se adapta.

**Elección.** Una aplicación con barra lateral filtrada por rol. El administrador ve solo *Gestión de créditos*; el estudiante ve *Mi resumen* y, si no tiene una solicitud activa, *Solicitar financiamiento*.

**Por qué.** Es como funciona el producto real: la misma plataforma, distinto lo que cada uno puede hacer. Además evita el error clásico de "esconder el botón": el filtro se aplica **dos veces**, en la barra lateral y del lado del servidor al entrar a la ruta. Un administrador que escribe `/solicitar` a mano es redirigido, y un estudiante que escribe `/creditos` también. Ocultar una opción es comodidad de la interfaz; la regla la aplica el servidor.

---

## 8. El dominio duplicado entre backend y frontend

**Problema.** Las clases de dominio tienen que correr en los dos lados, pero el repositorio son dos proyectos independientes, sin workspace de pnpm.

**Opciones.**
1. Monorepo con `packages/dominio` y las dos apps consumiéndolo.
2. Publicar el dominio como paquete npm.
3. Copiar los archivos y verificar que las copias no divergen.

**Elección.** La 3, con un script `pnpm dominio:verificar` que hace un `diff` entre las dos carpetas y falla si difieren.

**Por qué.** El monorepo es la respuesta correcta para un proyecto que va a crecer, y es lo que haría con más tiempo. Para esta entrega tenía más valor que cada proyecto se levante solo con un `pnpm install`, sin que el evaluador tenga que entender una configuración de workspace para correr la API. La copia es una decisión consciente, no un descuido, y el script lo demuestra: si alguien cambia una regla en un lado y no en el otro, la verificación falla.

---

## 9. El estado de la solicitud no se escribe, se transiciona

**Problema.** Aprobar una solicitud podría ser un `UPDATE solicitudes SET estado = 'aprobada'`.

**Elección.** El endpoint `PATCH /solicitudes/:id/estado` llama a `solicitud.aprobar(usuario)` o `solicitud.rechazar(usuario)`, que verifican quién lo pide y desde qué estado se sale.

**Por qué.** Escribir la columna directo deja la regla en el controller, donde hay que acordarse de repetirla en cada lugar que toque el estado — el endpoint, el seeder, un script de mantenimiento. Al ponerla en el objeto, una solicitud ya resuelta no puede volver a cambiar de estado **desde ningún lado**. El seeder es la prueba: construye los datos de ejemplo llamando a `aprobar()` y `rechazar()`, así que si mañana una transición deja de ser válida, el seed falla en vez de generar filas que la aplicación nunca podría haber producido.
