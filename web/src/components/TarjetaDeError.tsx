import { Aviso } from "./ui/Aviso";
import { Tarjeta } from "./ui/Tarjeta";

/** Error de carga de una pantalla: no deja la página en blanco ni tira un 500. */
export function TarjetaDeError({
  titulo = "No pudimos cargar esta información",
  mensaje,
}: {
  titulo?: string;
  mensaje: string;
}) {
  return (
    <Tarjeta>
      <h2 className="mb-3 text-base">{titulo}</h2>
      <Aviso tono="error">{mensaje}</Aviso>
    </Tarjeta>
  );
}
