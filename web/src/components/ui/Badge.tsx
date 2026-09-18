import type { EstadoSolicitud } from "@/dominio";
import { clases } from "./clases";

const ESTILOS: Record<EstadoSolicitud, string> = {
  pendiente: "bg-bc-pendiente-suave text-bc-pendiente",
  aprobada: "bg-bc-aprobada-suave text-bc-aprobada",
  rechazada: "bg-bc-rechazada-suave text-bc-rechazada",
};

const TEXTOS: Record<EstadoSolicitud, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

export function Badge({
  estado,
  tamanio = "normal",
}: {
  estado: EstadoSolicitud;
  tamanio?: "normal" | "grande";
}) {
  return (
    <span
      className={clases(
        "inline-flex items-center rounded-full font-semibold whitespace-nowrap",
        tamanio === "grande" ? "px-3.5 py-1.5 text-sm" : "px-2.5 py-1 text-xs",
        ESTILOS[estado],
      )}
    >
      {TEXTOS[estado]}
    </span>
  );
}

export function textoDeEstado(estado: EstadoSolicitud): string {
  return TEXTOS[estado];
}
