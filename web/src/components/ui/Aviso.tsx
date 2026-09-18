import type { ReactNode } from "react";
import { clases } from "./clases";
import { IconoDeAlerta } from "./Iconos";

type TonoDeAviso = "informacion" | "error";

const TONOS: Record<TonoDeAviso, string> = {
  informacion: "bg-bc-primary-suave text-bc-primary",
  error: "bg-bc-rechazada-suave text-bc-rechazada",
};

/** Mensaje de contexto o de error que no pertenece a un campo concreto. */
export function Aviso({
  tono = "informacion",
  children,
  className,
}: {
  tono?: TonoDeAviso;
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      role={tono === "error" ? "alert" : undefined}
      className={clases(
        "flex items-start gap-2 rounded-campo px-4 py-3 text-sm",
        TONOS[tono],
        className,
      )}
    >
      {tono === "error" && <IconoDeAlerta className="mt-0.5 h-4 w-4 shrink-0" />}
      <span>{children}</span>
    </p>
  );
}
