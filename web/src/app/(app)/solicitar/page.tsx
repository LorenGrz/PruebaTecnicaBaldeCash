import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { FormularioDeSolicitud } from "@/components/formularios/FormularioDeSolicitud";
import { comoSolicitudDeDominio } from "@/lib/adaptadores";
import { obtenerMiSolicitud } from "@/lib/servicio";
import { exigirRol } from "@/lib/sesion";

export const metadata: Metadata = {
  title: "Solicita tu financiamiento | BaldeCash",
};

/** Devuelve `null` si la API no responde: el formulario se muestra igual. */
async function solicitudActual(usuarioId: string) {
  try {
    return await obtenerMiSolicitud(usuarioId);
  } catch {
    return null;
  }
}

export default async function PaginaDeSolicitar() {
  const sesion = await exigirRol("estudiante");
  const solicitud = await solicitudActual(sesion.id);

  // Una solicitud activa por estudiante: si ya tiene una, el formulario no aplica.
  if (solicitud !== null && comoSolicitudDeDominio(solicitud).estaActiva()) {
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
