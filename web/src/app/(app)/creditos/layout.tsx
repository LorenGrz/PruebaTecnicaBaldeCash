import type { ReactNode } from "react";
import { exigirRol } from "@/lib/sesion";

/** Gestión de créditos: solo el analista. El estudiante rebota a su resumen. */
export default async function LayoutDeCreditos({ children }: { children: ReactNode }) {
  await exigirRol("admin");
  return <>{children}</>;
}
