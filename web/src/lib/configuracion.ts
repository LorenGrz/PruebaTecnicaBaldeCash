/**
 * Tasa anual usada para la cuota estimada que se muestra mientras el
 * estudiante mueve monto y plazo. La cifra que vale es la que devuelve la API
 * al crear la solicitud: esta solo pinta la estimación en vivo.
 */
const TASA_POR_DEFECTO = 0.24;

function leerTasa(): number {
  const crudo = process.env.NEXT_PUBLIC_TASA_ANUAL;
  if (!crudo) return TASA_POR_DEFECTO;
  const numero = Number(crudo);
  return Number.isFinite(numero) && numero >= 0 ? numero : TASA_POR_DEFECTO;
}

export const TASA_ANUAL_REFERENCIAL = leerTasa();
