import type { ReactNode } from "react";
import { clases } from "./clases";

interface PropsDeTarjeta {
  titulo?: string;
  accion?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Tarjeta({ titulo, accion, children, className }: PropsDeTarjeta) {
  return (
    <section
      className={clases(
        "rounded-tarjeta border border-bc-borde bg-bc-superficie p-5 sm:p-6",
        "transition-[border-color,box-shadow] duration-[--bc-media]",
        className,
      )}
    >
      {(titulo || accion) && (
        <header className="mb-4 flex items-center justify-between gap-3">
          {titulo && <h2 className="text-base sm:text-lg">{titulo}</h2>}
          {accion}
        </header>
      )}
      {children}
    </section>
  );
}

/** Par etiqueta/valor, la unidad de lectura de los detalles. */
export function Dato({
  etiqueta,
  children,
}: {
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-bc-apagado">{etiqueta}</dt>
      <dd className="text-sm font-semibold text-bc-tinta break-words">{children}</dd>
    </div>
  );
}
