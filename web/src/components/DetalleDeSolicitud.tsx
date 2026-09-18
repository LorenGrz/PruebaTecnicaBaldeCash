import Link from "next/link";
import type { ReactNode } from "react";
import { Badge } from "./ui/Badge";
import { Dato, Tarjeta } from "./ui/Tarjeta";
import {
  formatearFecha,
  formatearPlazo,
  formatearSoles,
  formatearTasa,
  referenciaCorta,
} from "@/lib/formato";
import type { SolicitudDTO } from "@/lib/tipos";

/**
 * Detalle de una solicitud. Es la misma vista para el analista y para el
 * estudiante: lo único que cambia es la barra de acciones, que se inyecta.
 */
export function DetalleDeSolicitud({
  solicitud,
  volverHref,
  volverTexto,
  acciones,
}: {
  solicitud: SolicitudDTO;
  volverHref: string;
  volverTexto: string;
  acciones?: ReactNode;
}) {
  const estudiante = solicitud.estudiante;

  return (
    <div className="flex flex-col gap-5">
      <Link
        href={volverHref}
        className="w-fit rounded-campo text-sm font-semibold text-bc-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary"
      >
        ← {volverTexto}
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl">Solicitud #{referenciaCorta(solicitud.id)}</h1>
        <Badge estado={solicitud.estado} tamanio="grande" />
      </div>

      <Tarjeta titulo="Estudiante">
        <dl className="grid gap-4 sm:grid-cols-2">
          <Dato etiqueta="Nombre">{estudiante?.nombre ?? "—"}</Dato>
          <Dato etiqueta="DNI">{estudiante?.dni ?? "—"}</Dato>
          <Dato etiqueta="Correo">{estudiante?.email ?? "—"}</Dato>
          <Dato etiqueta="Teléfono">{estudiante?.telefono ?? "—"}</Dato>
        </dl>
      </Tarjeta>

      <Tarjeta titulo="Financiamiento">
        <dl className="grid gap-4 sm:grid-cols-3">
          <Dato etiqueta="Monto">{formatearSoles(solicitud.monto)}</Dato>
          <Dato etiqueta="Plazo">{formatearPlazo(solicitud.plazoMeses)}</Dato>
          <Dato etiqueta="Tasa anual">{formatearTasa(solicitud.tasaAnual)}</Dato>
        </dl>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-campo bg-bc-primary-suave px-4 py-4">
          <p className="text-sm font-semibold text-bc-primary">Cuota mensual</p>
          <p className="font-display text-3xl font-extrabold text-bc-primary">
            {formatearSoles(solicitud.cuotaMensual)}
          </p>
        </div>
        <p className="mt-3 text-xs text-bc-apagado">
          Enviada el {formatearFecha(solicitud.creadoEn)}.
        </p>
      </Tarjeta>

      {acciones && <Tarjeta titulo="Resolver solicitud">{acciones}</Tarjeta>}
    </div>
  );
}
