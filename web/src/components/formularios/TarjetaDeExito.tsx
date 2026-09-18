import { Badge } from "@/components/ui/Badge";
import { clasesDeBoton } from "@/components/ui/Boton";
import { IconoDeExito } from "@/components/ui/Iconos";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { formatearPlazo, formatearSoles } from "@/lib/formato";
import type { SolicitudDTO } from "@/lib/tipos";

/** Confirmación tras el 201: lo primero que se lee es la cuota. */
export function TarjetaDeExito({ solicitud }: { solicitud: SolicitudDTO }) {
  return (
    <Tarjeta className="flex flex-col items-center gap-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-bc-aprobada-suave text-bc-aprobada">
        <IconoDeExito className="h-7 w-7" />
      </span>

      <div className="flex flex-col gap-1">
        <h2 className="text-2xl">¡Solicitud enviada!</h2>
        <p className="text-sm text-bc-apagado">
          Un analista de BaldeCash la revisará en las próximas horas.
        </p>
      </div>

      <div className="w-full rounded-tarjeta bg-bc-primary-suave px-6 py-5">
        <p className="text-sm font-medium text-bc-primary">Cuota mensual</p>
        <p className="font-display text-4xl font-extrabold text-bc-primary">
          {formatearSoles(solicitud.cuotaMensual)}
        </p>
      </div>

      <dl className="grid w-full grid-cols-3 gap-3 border-t border-bc-borde pt-5 text-center">
        <div className="flex flex-col gap-1">
          <dt className="text-xs uppercase tracking-wide text-bc-apagado">Monto</dt>
          <dd className="text-sm font-semibold">{formatearSoles(solicitud.monto)}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs uppercase tracking-wide text-bc-apagado">Plazo</dt>
          <dd className="text-sm font-semibold">{formatearPlazo(solicitud.plazoMeses)}</dd>
        </div>
        <div className="flex flex-col gap-1">
          <dt className="text-xs uppercase tracking-wide text-bc-apagado">Estado</dt>
          <dd className="flex justify-center">
            <Badge estado={solicitud.estado} />
          </dd>
        </div>
      </dl>

      {/*
        Navegación completa a propósito, no <Link>. Con navegación de cliente el
        layout compartido sale de la caché del router y la barra lateral sigue
        ofreciendo "Solicitar financiamiento", que ya no corresponde: el
        estudiante acaba de crear su solicitud activa. Recargar la ruta entera
        vuelve a calcular la navegación en el servidor.
      */}
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/resumen" className={clasesDeBoton("primaria", true)}>
        Ver mi solicitud
      </a>
    </Tarjeta>
  );
}
