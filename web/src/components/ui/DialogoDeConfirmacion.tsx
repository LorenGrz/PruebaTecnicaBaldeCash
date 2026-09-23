"use client";

import { useEffect, useId, useRef, type MouseEvent, type ReactNode } from "react";
import { Boton, type VarianteDeBoton } from "./Boton";

interface Props {
  abierto: boolean;
  titulo: string;
  /** Qué pasa si se confirma. */
  children: ReactNode;
  textoConfirmar: string;
  textoCargando?: string;
  varianteConfirmar?: VarianteDeBoton;
  /** Mientras es `true` el diálogo no se deja cerrar: la acción ya salió. */
  cargando?: boolean;
  onCancelar: () => void;
  /** `name` y `value` del botón de confirmar, que hace submit del formulario que lo contiene. */
  nombre?: string;
  valor?: string;
}

/**
 * Pide confirmación antes de una acción que no tiene vuelta atrás.
 *
 * Se apoya en `<dialog>` con `showModal()` en lugar de una librería: el
 * navegador ya lo pone por encima de todo, oscurece el fondo, atrapa el foco
 * adentro y lo cierra con Esc. El botón de confirmar es un submit común, así
 * que el diálogo tiene que vivir dentro del `<form>` al que pertenece.
 */
export function DialogoDeConfirmacion({
  abierto,
  titulo,
  children,
  textoConfirmar,
  textoCargando,
  varianteConfirmar = "primaria",
  cargando = false,
  onCancelar,
  nombre,
  valor,
}: Props) {
  const referencia = useRef<HTMLDialogElement>(null);
  const idTitulo = useId();
  const idDescripcion = useId();

  useEffect(() => {
    const dialogo = referencia.current;
    if (!dialogo) return;
    if (abierto && !dialogo.open) dialogo.showModal();
    if (!abierto && dialogo.open) dialogo.close();
  }, [abierto]);

  // Un clic que cae en el propio <dialog> y no en su contenido es un clic en el fondo.
  function alHacerClic(evento: MouseEvent<HTMLDialogElement>) {
    if (evento.target === evento.currentTarget && !cargando) onCancelar();
  }

  return (
    <dialog
      ref={referencia}
      aria-labelledby={idTitulo}
      aria-describedby={idDescripcion}
      onClick={alHacerClic}
      onCancel={(evento) => {
        // Esc: el navegador cerraría solo; el estado lo decide el componente padre.
        evento.preventDefault();
        if (!cargando) onCancelar();
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-tarjeta border border-bc-borde bg-bc-superficie p-0 text-bc-tinta open:animate-entrar backdrop:bg-bc-tinta/40"
    >
      <div className="flex flex-col gap-5 p-6">
        <div className="flex flex-col gap-2">
          <h2 id={idTitulo} className="text-lg">
            {titulo}
          </h2>
          <div id={idDescripcion} className="text-sm text-bc-apagado">
            {children}
          </div>
        </div>
        {/* Cancelar va primero en el DOM: es lo que recibe el foco al abrir, la opción segura. */}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundaria" onClick={onCancelar} disabled={cargando}>
            Cancelar
          </Boton>
          <Boton
            type="submit"
            name={nombre}
            value={valor}
            variante={varianteConfirmar}
            cargando={cargando}
            textoCargando={textoCargando}
          >
            {textoConfirmar}
          </Boton>
        </div>
      </div>
    </dialog>
  );
}
