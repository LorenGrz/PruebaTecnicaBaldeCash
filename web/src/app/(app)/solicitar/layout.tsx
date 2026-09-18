import type { ReactNode } from "react";
import { exigirRol } from "@/lib/sesion";

/**
 * Segundo filtro por rol: la barra lateral ya oculta esta sección para el
 * analista, pero el que escribe la URL a mano también tiene que rebotar.
 */
export default async function LayoutDeSolicitar({ children }: { children: ReactNode }) {
  await exigirRol("estudiante");
  return <>{children}</>;
}
