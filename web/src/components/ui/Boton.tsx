import type { ButtonHTMLAttributes } from "react";
import { clases } from "./clases";

export type VarianteDeBoton = "primaria" | "secundaria" | "aprobar" | "rechazar";

const BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 h-11 text-sm font-semibold " +
  // El toque hunde el botón apenas: confirma que el gesto llegó antes de que
  // el servidor conteste, que en móvil es donde más se duda de si se apretó.
  "transition-[background-color,color,border-color,transform] duration-[--bc-rapida] active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-60 disabled:active:scale-100";

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

/** Anillo que gira mientras se espera la respuesta del servidor. */
function Girador() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="animate-girar h-4 w-4 shrink-0"
      fill="none"
    >
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
      <path
        d="M8 1.5a6.5 6.5 0 0 1 6.5 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
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
      {cargando ? (
        <>
          <Girador />
          {textoCargando}
        </>
      ) : (
        children
      )}
    </button>
  );
}
