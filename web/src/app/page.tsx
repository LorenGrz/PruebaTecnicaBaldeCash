import { redirect } from "next/navigation";
import { INICIO_POR_ROL, leerSesion } from "@/lib/sesion";

/** La raíz no tiene contenido propio: manda a la pantalla que corresponde al rol. */
export default async function Inicio() {
  const sesion = await leerSesion();
  redirect(sesion ? INICIO_POR_ROL[sesion.rol] : "/ingreso");
}
