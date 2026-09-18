import type { ReactNode } from "react";
import { exigirRol } from "@/lib/sesion";

/** Solo el estudiante ve su resumen; el analista rebota a su propia sección. */
export default async function LayoutDeResumen({ children }: { children: ReactNode }) {
  await exigirRol("estudiante");
  return <>{children}</>;
}
