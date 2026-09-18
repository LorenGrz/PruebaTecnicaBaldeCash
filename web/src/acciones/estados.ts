/**
 * Estados que viajan entre las server actions y los formularios cliente.
 *
 * Viven fuera de los módulos `"use server"` porque esos solo pueden exportar
 * funciones asíncronas.
 */
import type { ErroresPorCampo, SolicitudDTO } from "@/lib/tipos";

export interface EstadoDeIngreso {
  /** `ingreso` pide el DNI; `alta` es la misma tarjeta expandida tras un 404. */
  modo: "ingreso" | "alta";
  dni: string;
  valores: { nombre: string; email: string; telefono: string };
  errores: ErroresPorCampo;
  /** Error general: no corresponde a ningún campo (conexión, 409, 500). */
  mensaje: string | null;
}

export const ESTADO_INICIAL_DE_INGRESO: EstadoDeIngreso = {
  modo: "ingreso",
  dni: "",
  valores: { nombre: "", email: "", telefono: "" },
  errores: {},
  mensaje: null,
};

export interface EstadoDeSolicitud {
  fase: "editando" | "enviada";
  solicitud: SolicitudDTO | null;
  errores: ErroresPorCampo;
  mensaje: string | null;
}

export const ESTADO_INICIAL_DE_SOLICITUD: EstadoDeSolicitud = {
  fase: "editando",
  solicitud: null,
  errores: {},
  mensaje: null,
};

export interface EstadoDeResolucion {
  mensaje: string | null;
}

export const ESTADO_INICIAL_DE_RESOLUCION: EstadoDeResolucion = { mensaje: null };

/** Lectura tipada de un campo de formulario. */
export function textoDeFormulario(formData: FormData, clave: string): string {
  const valor = formData.get(clave);
  return typeof valor === "string" ? valor.trim() : "";
}
