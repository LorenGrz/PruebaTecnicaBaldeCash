import type { ElementType, ReactNode } from "react";
import { clases } from "./clases";

/**
 * Entrada escalonada de una lista.
 *
 * El retardo se calcula por posición y se corta a los seis elementos: más allá
 * de eso la espera deja de leerse como orden y empieza a leerse como lentitud.
 * Es CSS puro con `animation-delay`, así que funciona en componentes de
 * servidor y no cuesta JavaScript en el cliente.
 */
const RETARDO_POR_ELEMENTO = 55;
const RETARDO_MAXIMO = 330;

interface Props {
  /** Posición en la lista, empezando en 0. */
  indice?: number;
  className?: string;
  children: ReactNode;
  /** Etiqueta a renderizar; por defecto un `div`. */
  como?: ElementType;
}

export function Revelar({ indice = 0, className, children, como }: Props) {
  const Etiqueta = como ?? "div";
  const retardo = Math.min(indice * RETARDO_POR_ELEMENTO, RETARDO_MAXIMO);

  return (
    <Etiqueta
      className={clases("animate-entrar", className)}
      style={{ animationDelay: `${retardo}ms` }}
    >
      {children}
    </Etiqueta>
  );
}
