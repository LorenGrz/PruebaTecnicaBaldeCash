import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import {
  formatearFecha,
  formatearPlazo,
  formatearSoles,
  referenciaCorta,
} from "@/lib/formato";
import type { SolicitudDTO } from "@/lib/tipos";

/**
 * Una solicitud del listado del administrador, en formato tarjeta.
 *
 * Es la vista de pantallas angostas: la tabla necesita 46rem para que las siete
 * columnas se lean, y a 390px eso obliga a desplazarse en horizontal para
 * enterarse del estado, que es justo el dato por el que se entra a esta
 * pantalla. La tarjeta pone lo importante en vertical y deja toda la fila como
 * zona tocable.
 */
export function TarjetaDeSolicitud({ solicitud }: { solicitud: SolicitudDTO }) {
  return (
    <Link
      href={`/creditos/${solicitud.id}`}
      className="flex flex-col gap-3 rounded-tarjeta border border-bc-borde bg-bc-superficie p-4 transition-[border-color,box-shadow] duration-[--bc-media] hover:border-bc-primary/40 hover:shadow-[0_2px_12px_rgba(70,84,205,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-bc-tinta">
            {solicitud.estudiante?.nombre ?? "—"}
          </p>
          <p className="truncate text-xs text-bc-apagado">
            DNI {solicitud.estudiante?.dni ?? "—"} · #{referenciaCorta(solicitud.id)}
          </p>
        </div>
        <Badge estado={solicitud.estado} />
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-bc-borde pt-3">
        <Par etiqueta="Monto">{formatearSoles(solicitud.monto)}</Par>
        <Par etiqueta="Plazo">{formatearPlazo(solicitud.plazoMeses)}</Par>
        <Par etiqueta="Cuota mensual">{formatearSoles(solicitud.cuotaMensual)}</Par>
        <Par etiqueta="Enviada el">{formatearFecha(solicitud.creadoEn)}</Par>
      </dl>
    </Link>
  );
}

function Par({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-bc-apagado">
        {etiqueta}
      </dt>
      <dd className="text-sm font-semibold tabular-nums text-bc-tinta">{children}</dd>
    </div>
  );
}
