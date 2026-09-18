import { clases } from "./clases";

/**
 * Bloque gris que ocupa el lugar de un dato mientras llega.
 *
 * Las pantallas se renderizan en el servidor y esperan a la API, así que sin
 * esto el navegador se queda con la pantalla anterior y parece colgado. El
 * esqueleto reserva la forma real del contenido: cuando llega, nada salta de
 * lugar.
 */
export function Esqueleto({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={clases("animate-latir rounded-campo bg-bc-borde", className)}
    />
  );
}

/** Esqueleto con la forma de una tarjeta de solicitud. */
export function EsqueletoDeTarjeta() {
  return (
    <div className="rounded-tarjeta border border-bc-borde bg-bc-superficie p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <Esqueleto className="h-5 w-40" />
        <Esqueleto className="h-6 w-24 rounded-full" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((posicion) => (
          <div key={posicion} className="flex flex-col gap-2">
            <Esqueleto className="h-3 w-16" />
            <Esqueleto className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Encabezado de pantalla: título y bajada. */
export function EsqueletoDeEncabezado() {
  return (
    <div className="flex flex-col gap-2">
      <Esqueleto className="h-7 w-48" />
      <Esqueleto className="h-4 w-72 max-w-full" />
    </div>
  );
}
