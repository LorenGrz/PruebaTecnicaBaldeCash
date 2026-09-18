/** Formateo para Perú. Se fija la zona horaria para que servidor y navegador
 *  pinten la misma fecha y no haya desajuste de hidratación. */

const SOLES = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const SOLES_SIN_DECIMALES = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  maximumFractionDigits: 0,
});

const FECHA = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "America/Lima",
});

export function formatearSoles(monto: number): string {
  return SOLES.format(monto);
}

export function formatearSolesRedondo(monto: number): string {
  return SOLES_SIN_DECIMALES.format(monto);
}

export function formatearFecha(fecha: string | Date | undefined): string {
  if (!fecha) return "—";
  const valor = typeof fecha === "string" ? new Date(fecha) : fecha;
  if (Number.isNaN(valor.getTime())) return "—";
  return FECHA.format(valor);
}

export function formatearPlazo(meses: number): string {
  return `${meses} meses`;
}

export function formatearTasa(tasaAnual: number): string {
  return `${(tasaAnual * 100).toLocaleString("es-PE", { maximumFractionDigits: 2 })}%`;
}

/** Los ids son uuid; en la interfaz alcanza con un tramo corto y estable. */
export function referenciaCorta(id: string): string {
  return id.replace(/-/g, "").slice(0, 4).toUpperCase();
}
