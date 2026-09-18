import type { Metadata } from "next";
import { DetalleDeSolicitud } from "@/components/DetalleDeSolicitud";
import { TarjetaDeError } from "@/components/TarjetaDeError";
import { AccionesDeSolicitud } from "@/components/formularios/AccionesDeSolicitud";
import { comoErrorDeApi } from "@/lib/api";
import { obtenerSolicitud } from "@/lib/servicio";
import { exigirRol } from "@/lib/sesion";
import type { SolicitudDTO } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Detalle de la solicitud | BaldeCash",
};

type Resultado = { ok: true; solicitud: SolicitudDTO } | { ok: false; mensaje: string };

async function cargar(usuarioId: string, id: string): Promise<Resultado> {
  try {
    return { ok: true, solicitud: await obtenerSolicitud(usuarioId, id) };
  } catch (error) {
    return { ok: false, mensaje: comoErrorDeApi(error).message };
  }
}

export default async function PaginaDeDetalleDeCredito(
  props: PageProps<"/creditos/[id]">,
) {
  const sesion = await exigirRol("admin");
  const { id } = await props.params;
  const resultado = await cargar(sesion.id, id);

  if (!resultado.ok) return <TarjetaDeError mensaje={resultado.mensaje} />;

  const solicitud = resultado.solicitud;

  return (
    <DetalleDeSolicitud
      solicitud={solicitud}
      volverHref="/creditos"
      volverTexto="Volver a solicitudes"
      // Una solicitud ya resuelta no vuelve a cambiar de estado (regla del dominio).
      acciones={
        solicitud.estado === "pendiente" ? <AccionesDeSolicitud id={solicitud.id} /> : undefined
      }
    />
  );
}
