import { redirect } from "next/navigation";
import { INICIO_POR_ROL, leerSesion } from "@/lib/sesion";

/**
 * La raíz no tiene pantalla propia: manda al ingreso, o directo al inicio del
 * rol si ya hay sesión, para no mostrar el formulario a quien ya ingresó.
 */
export default async function Inicio() {
  const sesion = await leerSesion();
  redirect(sesion ? INICIO_POR_ROL[sesion.rol] : "/ingreso");
}
