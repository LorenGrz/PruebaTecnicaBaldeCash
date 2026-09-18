import type { Sesion } from "@/lib/sesion";
import { BotonDeSalida } from "./BotonDeSalida";
import { Marca } from "./Marca";
import { clases } from "./ui/clases";

const ETIQUETA_DE_ROL = {
  admin: "Analista",
  estudiante: "Estudiante",
} as const;

const ESTILO_DE_ROL = {
  admin: "bg-bc-primary-suave text-bc-primary",
  estudiante: "bg-bc-acento-suave text-bc-primary",
} as const;

/** Barra superior: marca a la izquierda, usuario y chip de rol a la derecha. */
export function EncabezadoDeApp({ sesion }: { sesion: Sesion }) {
  return (
    <header className="flex items-center justify-between gap-4 border-b border-bc-borde bg-bc-superficie px-4 py-3 sm:px-6">
      <Marca />
      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden text-sm font-semibold text-bc-tinta sm:inline">
          {sesion.nombre}
        </span>
        <span
          className={clases(
            "rounded-full px-2.5 py-1 text-xs font-semibold",
            ESTILO_DE_ROL[sesion.rol],
          )}
        >
          {ETIQUETA_DE_ROL[sesion.rol]}
        </span>
        <BotonDeSalida />
      </div>
    </header>
  );
}
