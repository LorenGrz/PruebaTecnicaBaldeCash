import type { InputHTMLAttributes, ReactNode } from "react";
import { Input } from "./Input";

interface PropsBase {
  id: string;
  etiqueta: string;
  ayuda?: string;
  error?: string | null;
}

/** Etiqueta + control + mensaje de ayuda o de error, con el `aria` cableado. */
export function EnvoltorioDeCampo({
  id,
  etiqueta,
  ayuda,
  error,
  children,
}: PropsBase & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-bc-tinta">
        {etiqueta}
      </label>
      {children}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="animate-desplegar text-xs font-medium text-bc-rechazada"
        >
          {error}
        </p>
      ) : ayuda ? (
        <p id={`${id}-ayuda`} className="text-xs text-bc-apagado">
          {ayuda}
        </p>
      ) : null}
    </div>
  );
}

interface PropsDeCampo extends PropsBase, Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  prefijo?: string;
}

/** Campo de texto completo: es el que usan los formularios. */
export function Campo({ id, etiqueta, ayuda, error, prefijo, ...resto }: PropsDeCampo) {
  const describedBy = error ? `${id}-error` : ayuda ? `${id}-ayuda` : undefined;
  return (
    <EnvoltorioDeCampo id={id} etiqueta={etiqueta} ayuda={ayuda} error={error}>
      <Input
        {...resto}
        id={id}
        name={resto.name ?? id}
        prefijo={prefijo}
        invalido={Boolean(error)}
        aria-describedby={describedBy}
      />
    </EnvoltorioDeCampo>
  );
}
