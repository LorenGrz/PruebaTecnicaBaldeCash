import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioDeSolicitud } from "@/components/formularios/FormularioDeSolicitud";
import { comoSolicitudDeDominio } from "@/lib/adaptadores";
import { obtenerMisSolicitudes } from "@/lib/servicio";
import { exigirRol } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Solicita tu financiamiento | BaldeCash",
};

/** Devuelve una lista vacía si la API no responde: el formulario se muestra igual. */
async function historial(usuarioId: string) {
  try {
    return await obtenerMisSolicitudes(usuarioId);
  } catch {
    return [];
  }
}

export default async function PaginaDeSolicitar() {
  const sesion = await exigirRol("estudiante");
  const solicitudes = await historial(sesion.id);

  // Una solicitud activa por estudiante: si alguna ocupa el cupo, el
  // formulario no aplica. La regla la responde el dominio, igual que en la API.
  if (solicitudes.some((solicitud) => comoSolicitudDeDominio(solicitud).estaActiva())) {
    redirect("/resumen");
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl">Solicita tu financiamiento</h1>
        <p className="text-sm text-bc-apagado">
          Revisa tus datos, elige monto y plazo, y envía la solicitud.
        </p>
      </header>
      <FormularioDeSolicitud
        datos={{
          nombre: sesion.nombre,
          dni: sesion.dni,
          email: sesion.email,
          telefono: sesion.telefono,
        }}
      />
    </div>
  );
}
