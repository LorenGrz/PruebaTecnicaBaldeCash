import type { InputHTMLAttributes } from "react";
import { clases } from "./clases";

interface PropsDeInput extends InputHTMLAttributes<HTMLInputElement> {
  invalido?: boolean;
  /** Texto fijo a la izquierda del valor, por ejemplo "S/". */
  prefijo?: string;
}

const BASE =
  "h-11 w-full rounded-campo border bg-bc-superficie px-3 text-sm text-bc-tinta " +
  "placeholder:text-bc-apagado/60 focus:outline-none focus:ring-2 focus:ring-bc-primary focus:border-bc-primary " +
  "disabled:bg-bc-fondo read-only:bg-bc-fondo read-only:text-bc-apagado";

export function Input({ invalido = false, prefijo, className, ...resto }: PropsDeInput) {
  const campo = (
    <input
      {...resto}
      aria-invalid={invalido || undefined}
      className={clases(
        BASE,
        invalido ? "border-bc-rechazada focus:ring-bc-rechazada" : "border-bc-borde",
        prefijo && "rounded-l-none border-l-0 focus:ring-offset-0",
        className,
      )}
    />
  );

  if (!prefijo) return campo;

  return (
    <div className="flex">
      <span
        aria-hidden="true"
        className={clases(
          "flex h-11 items-center rounded-l-campo border border-r-0 px-3 text-sm font-semibold text-bc-apagado bg-bc-fondo",
          invalido ? "border-bc-rechazada" : "border-bc-borde",
        )}
      >
        {prefijo}
      </span>
      {campo}
    </div>
  );
}
