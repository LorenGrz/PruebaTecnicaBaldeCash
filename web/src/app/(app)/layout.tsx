import type { ReactNode } from "react";
import { EncabezadoDeApp } from "@/components/EncabezadoDeApp";
import { BarraLateral, type OpcionDeNavegacion } from "@/components/ui/BarraLateral";
import { comoSolicitudDeDominio } from "@/lib/adaptadores";
import { obtenerMisSolicitudes } from "@/lib/servicio";
import { exigirSesion, type Sesion } from "@/lib/sesion";

/**
 * Si la API no responde no se puede saber si hay una solicitud activa: se deja
 * visible la opción de solicitar y la pantalla correspondiente muestra el error.
 */
async function tieneSolicitudActiva(usuarioId: string): Promise<boolean> {
  try {
    const solicitudes = await obtenerMisSolicitudes(usuarioId);
    return solicitudes.some((solicitud) =>
      comoSolicitudDeDominio(solicitud).estaActiva(),
    );
  } catch {
    return false;
  }
}

/** Primer filtro por rol: la barra lateral solo ofrece lo que el rol puede ver. */
async function opcionesDeNavegacion(sesion: Sesion): Promise<OpcionDeNavegacion[]> {
  if (sesion.rol === "admin") {
    return [{ href: "/creditos", texto: "Gestión de créditos", icono: "carpeta" }];
  }

  const opciones: OpcionDeNavegacion[] = [
    { href: "/resumen", texto: "Mi resumen", icono: "resumen" },
  ];
  if (!(await tieneSolicitudActiva(sesion.id))) {
    opciones.push({ href: "/solicitar", texto: "Solicitar financiamiento", icono: "mas" });
  }
  return opciones;
}

export default async function LayoutDeAplicacion({ children }: { children: ReactNode }) {
  const sesion = await exigirSesion();
  const opciones = await opcionesDeNavegacion(sesion);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <EncabezadoDeApp sesion={sesion} />
      <div className="flex flex-1 flex-col md:flex-row">
        <BarraLateral opciones={opciones} />
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mx-auto w-full max-w-4xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
