import type { ButtonHTMLAttributes } from "react";
import { clases } from "./clases";

export type VarianteDeBoton = "primaria" | "secundaria" | "aprobar" | "rechazar";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-semibold transition-colors " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTES: Record<VarianteDeBoton, string> = {
  primaria: "bg-bc-acento text-bc-tinta hover:bg-bc-acento/85",
  secundaria: "border border-bc-primary text-bc-primary bg-bc-superficie hover:bg-bc-primary-suave",
  aprobar: "bg-bc-aprobada text-white hover:bg-bc-aprobada/90",
  rechazar: "border border-bc-rechazada text-bc-rechazada bg-bc-superficie hover:bg-bc-rechazada-suave",
};

/** Clases del botón, para pintar un `<Link>` con el mismo aspecto. */
export function clasesDeBoton(
  variante: VarianteDeBoton = "primaria",
  anchoCompleto = false,
): string {
  return clases(BASE, VARIANTES[variante], anchoCompleto && "w-full");
}

interface PropsDeBoton extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: VarianteDeBoton;
  anchoCompleto?: boolean;
  /** Deshabilita el botón y muestra `textoCargando`. */
  cargando?: boolean;
  textoCargando?: string;
}

export function Boton({
  variante = "primaria",
  anchoCompleto = false,
  cargando = false,
  textoCargando = "Enviando...",
  className,
  children,
  disabled,
  ...resto
}: PropsDeBoton) {
  return (
    <button
      {...resto}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clases(clasesDeBoton(variante, anchoCompleto), className)}
    >
      {cargando ? textoCargando : children}
    </button>
  );
}
