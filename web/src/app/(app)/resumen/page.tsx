import type { Metadata } from "next";
import Link from "next/link";
import { HistorialDeSolicitudes } from "@/components/HistorialDeSolicitudes";
import { TarjetaDeError } from "@/components/TarjetaDeError";
import { clasesDeBoton } from "@/components/ui/Boton";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { comoErrorDeApi } from "@/lib/api";
import { comoSolicitudDeDominio } from "@/lib/adaptadores";
import { obtenerMisSolicitudes } from "@/lib/servicio";
import { exigirRol } from "@/lib/sesion";
import type { SolicitudDTO } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Mi resumen | BaldeCash",
};

type Resultado =
  | { ok: true; solicitudes: SolicitudDTO[] }
  | { ok: false; mensaje: string };

async function cargar(usuarioId: string): Promise<Resultado> {
  try {
    return { ok: true, solicitudes: await obtenerMisSolicitudes(usuarioId) };
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

  const { solicitudes } = resultado;

  // Quién puede pedir de nuevo lo decide el dominio, no esta pantalla: se
  // puede cuando ninguna solicitud ocupa el cupo. Es la misma regla que aplica
  // la API al responder 409.
  const tieneActiva = solicitudes.some((solicitud) =>
    comoSolicitudDeDominio(solicitud).estaActiva(),
  );

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl">Mi resumen</h1>
        <p className="text-sm text-bc-apagado">
          Hola {sesion.nombre.split(" ")[0]}, este es el estado de tu financiamiento.
        </p>
      </header>

      {solicitudes.length === 0 ? (
        <SinSolicitudes />
      ) : (
        <>
          <HistorialDeSolicitudes solicitudes={solicitudes} />

          {!tieneActiva && (
            <Tarjeta className="flex flex-col items-start gap-3">
              <h2 className="text-base">Puedes enviar una nueva solicitud</h2>
              <p className="text-sm text-bc-apagado">
                Ninguna de tus solicitudes está en curso. Un rechazo no te deja fuera:
                puedes volver a pedir con otro monto o plazo.
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
