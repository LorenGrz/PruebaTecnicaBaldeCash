import { cerrarSesion } from "@/acciones/sesion";

/** Cerrar sesión. Un `<form>` porque la acción borra una cookie. */
export function BotonDeSalida() {
  return (
    <form action={cerrarSesion}>
      <button
        type="submit"
        className="rounded-campo px-2 py-1 text-xs font-semibold text-bc-apagado hover:text-bc-tinta focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bc-primary"
      >
        Salir
      </button>
    </form>
  );
}
