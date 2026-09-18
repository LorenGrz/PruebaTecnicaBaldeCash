"use client";

import { Solicitud } from "@/dominio";
import { clases } from "@/components/ui/clases";

/**
 * Control segmentado de plazo. Los valores salen del dominio, así que agregar
 * un plazo nuevo en la regla lo agrega también acá.
 */
export function SelectorDePlazo({
  valor,
  onCambio,
  error,
}: {
  valor: number;
  onCambio: (plazo: number) => void;
  error?: string;
}) {
  return (
    <fieldset className="flex flex-col gap-1.5">
      <legend className="mb-1.5 text-sm font-medium text-bc-tinta">Plazo</legend>
      <div
        role="radiogroup"
        aria-label="Plazo en meses"
        className="grid grid-cols-4 gap-2 rounded-campo bg-bc-fondo p-1"
      >
        {Solicitud.PLAZOS_PERMITIDOS.map((plazo) => {
          const seleccionado = plazo === valor;
          return (
            <button
              key={plazo}
              type="button"
              role="radio"
              aria-checked={seleccionado}
              onClick={() => onCambio(plazo)}
              className={clases(
                "h-10 rounded-campo text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary",
                seleccionado
                  ? "bg-bc-primary text-white"
                  : "text-bc-apagado hover:bg-bc-superficie hover:text-bc-tinta",
              )}
            >
              {plazo}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-bc-apagado">Meses para pagar el financiamiento.</p>
      {error && (
        <p role="alert" className="text-xs font-medium text-bc-rechazada">
          {error}
        </p>
      )}
      <input type="hidden" name="plazoMeses" value={valor} />
    </fieldset>
  );
}
