import type { Metadata } from "next";
import Link from "next/link";
import { TarjetaDeError } from "@/components/TarjetaDeError";
import { Badge } from "@/components/ui/Badge";
import { clasesDeBoton } from "@/components/ui/Boton";
import { Dato, Tarjeta } from "@/components/ui/Tarjeta";
import { comoErrorDeApi } from "@/lib/api";
import { comoSolicitudDeDominio } from "@/lib/adaptadores";
import {
  formatearFecha,
  formatearPlazo,
  formatearSoles,
  referenciaCorta,
} from "@/lib/formato";
import { obtenerMiSolicitud } from "@/lib/servicio";
import { exigirRol } from "@/lib/sesion";
import type { SolicitudDTO } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Mi resumen | BaldeCash",
};

type Resultado =
  | { ok: true; solicitud: SolicitudDTO | null }
  | { ok: false; mensaje: string };

async function cargar(usuarioId: string): Promise<Resultado> {
  try {
    return { ok: true, solicitud: await obtenerMiSolicitud(usuarioId) };
  } catch (error) {
    return { ok: false, mensaje: comoErrorDeApi(error).message };
  }
}

function SinSolicitudes() {
  return (
    <Tarjeta className="flex flex-col items-center gap-4 py-10 text-center">
      <h2 className="text-lg">Todavía no enviaste ninguna solicitud</h2>
      <p className="max-w-md text-sm text-bc-apagado">
        Cuando envíes una, acá vas a ver su estado, el monto, el plazo y la cuota mensual.
      </p>
      <Link href="/solicitar" className={clasesDeBoton("primaria")}>
        Solicitar financiamiento
      </Link>
    </Tarjeta>
  );
}

export default async function PaginaDeResumen() {
  const sesion = await exigirRol("estudiante");
  const resultado = await cargar(sesion.id);

  if (!resultado.ok) {
    return (
      <div className="flex flex-col gap-5">
        <h1 className="text-2xl">Mi resumen</h1>
        <TarjetaDeError mensaje={resultado.mensaje} />
      </div>
    );
  }

  const solicitud = resultado.solicitud;

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl">Mi resumen</h1>
        <p className="text-sm text-bc-apagado">
          Hola {sesion.nombre.split(" ")[0]}, este es el estado de tu financiamiento.
        </p>
      </header>

      {solicitud === null ? (
        <SinSolicitudes />
      ) : (
        <>
          <Tarjeta
            titulo={`Solicitud #${referenciaCorta(solicitud.id)}`}
            accion={<Badge estado={solicitud.estado} tamanio="grande" />}
          >
            <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Dato etiqueta="Monto">{formatearSoles(solicitud.monto)}</Dato>
              <Dato etiqueta="Plazo">{formatearPlazo(solicitud.plazoMeses)}</Dato>
              <Dato etiqueta="Cuota mensual">{formatearSoles(solicitud.cuotaMensual)}</Dato>
              <Dato etiqueta="Enviada el">{formatearFecha(solicitud.creadoEn)}</Dato>
            </dl>
            <Link
              href={`/resumen/${solicitud.id}`}
              className="mt-5 inline-block rounded-campo text-sm font-semibold text-bc-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary"
            >
              Ver detalle de la solicitud →
            </Link>
          </Tarjeta>

          {comoSolicitudDeDominio(solicitud).permiteReenvio() && (
            <Tarjeta className="flex flex-col items-start gap-3">
              <h2 className="text-base">Tu solicitud fue rechazada</h2>
              <p className="text-sm text-bc-apagado">
                Puedes enviar una nueva con otro monto o plazo. Un rechazo no te deja fuera.
              </p>
              <Link href="/solicitar" className={clasesDeBoton("primaria")}>
                Enviar una nueva solicitud
              </Link>
            </Tarjeta>
          )}
        </>
      )}
    </div>
  );
}
