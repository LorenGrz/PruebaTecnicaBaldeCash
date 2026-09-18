import type { Metadata } from "next";
import { DetalleDeSolicitud } from "@/components/DetalleDeSolicitud";
import { TarjetaDeError } from "@/components/TarjetaDeError";
import { comoErrorDeApi } from "@/lib/api";
import { obtenerSolicitud } from "@/lib/servicio";
import { exigirRol } from "@/lib/sesion";
import type { SolicitudDTO } from "@/lib/tipos";

export const metadata: Metadata = {
  title: "Detalle de mi solicitud | BaldeCash",
};

type Resultado = { ok: true; solicitud: SolicitudDTO } | { ok: false; mensaje: string };

async function cargar(usuarioId: string, id: string): Promise<Resultado> {
  try {
    return { ok: true, solicitud: await obtenerSolicitud(usuarioId, id) };
  } catch (error) {
    return { ok: false, mensaje: comoErrorDeApi(error).message };
  }
}

/** Misma vista que la del analista, sin barra de acciones. */
export default async function PaginaDeDetalleDelEstudiante(
  props: PageProps<"/resumen/[id]">,
) {
  const sesion = await exigirRol("estudiante");
  const { id } = await props.params;
  const resultado = await cargar(sesion.id, id);

  if (!resultado.ok) return <TarjetaDeError mensaje={resultado.mensaje} />;

  return (
    <DetalleDeSolicitud
      solicitud={resultado.solicitud}
      volverHref="/resumen"
      volverTexto="Volver a mi resumen"
    />
  );
}
