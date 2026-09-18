import type { SelectHTMLAttributes } from "react";
import { clases } from "./clases";

export interface OpcionDeSelector {
  valor: string;
  texto: string;
}

interface PropsDeSelector extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  etiqueta: string;
  opciones: OpcionDeSelector[];
  /** Deja la etiqueta visible solo para lectores de pantalla. */
  etiquetaOculta?: boolean;
}

export function Selector({
  id,
  etiqueta,
  opciones,
  etiquetaOculta = false,
  className,
  ...resto
}: PropsDeSelector) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className={clases(
          "text-sm font-medium text-bc-tinta",
          etiquetaOculta && "sr-only",
        )}
      >
        {etiqueta}
      </label>
      <select
        {...resto}
        id={id}
        name={resto.name ?? id}
        className={clases(
          "h-11 w-full rounded-campo border border-bc-borde bg-bc-superficie px-3 text-sm text-bc-tinta",
          "focus:outline-none focus:ring-2 focus:ring-bc-primary focus:border-bc-primary",
          className,
        )}
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.texto}
          </option>
        ))}
      </select>
    </div>
  );
}
