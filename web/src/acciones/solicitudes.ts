"use server";

import { revalidatePath } from "next/cache";
import { Solicitud, Usuario } from "@/dominio";
import { comoErrorDeApi } from "@/lib/api";
import { cambiarEstadoDeSolicitud, crearSolicitud } from "@/lib/servicio";
import { leerSesion } from "@/lib/sesion";
import type { ErroresPorCampo } from "@/lib/tipos";
import type { EstadoSolicitud } from "@/dominio";
import {
  type EstadoDeResolucion,
  type EstadoDeSolicitud,
  textoDeFormulario,
} from "./estados";

function numeroDeFormulario(formData: FormData, clave: string): number {
  const crudo = textoDeFormulario(formData, clave).replace(/[\s,]/g, "");
  if (crudo === "") return Number.NaN;
  return Number(crudo);
}

/**
 * Envía la solicitud. Revalida con las clases de dominio antes de salir a la
 * red: la API vuelve a hacerlo igual, pero así el usuario no paga un viaje
 * para que le digan que el monto está fuera de rango.
 */
export async function enviarSolicitud(
  _previo: EstadoDeSolicitud,
  formData: FormData,
): Promise<EstadoDeSolicitud> {
  const sesion = await leerSesion();
  if (!sesion) {
    return {
      fase: "editando",
      solicitud: null,
      errores: {},
      mensaje: "Tu sesión expiró. Vuelve a ingresar con tu DNI.",
    };
  }

  const datos = {
    nombre: textoDeFormulario(formData, "nombre"),
    dni: textoDeFormulario(formData, "dni"),
    email: textoDeFormulario(formData, "email"),
    telefono: textoDeFormulario(formData, "telefono"),
    monto: numeroDeFormulario(formData, "monto"),
    plazoMeses: numeroDeFormulario(formData, "plazoMeses"),
  };

  const errores: ErroresPorCampo = {};
  const revisar = (campo: string, mensaje: string | null) => {
    if (mensaje) errores[campo] = mensaje;
  };
  revisar("nombre", Usuario.validarNombre(datos.nombre));
  revisar("dni", Usuario.validarDni(datos.dni));
  revisar("email", Usuario.validarEmail(datos.email));
  revisar("telefono", Usuario.validarTelefono(datos.telefono));
  revisar("monto", Solicitud.validarMonto(datos.monto));
  revisar("plazoMeses", Solicitud.validarPlazo(datos.plazoMeses));

  if (Object.keys(errores).length > 0) {
    return { fase: "editando", solicitud: null, errores, mensaje: null };
  }

  try {
    const solicitud = await crearSolicitud(sesion.id, datos);
    // Acá no se revalida ninguna ruta ni se toca la cookie de sesión, y es a
    // propósito: las dos cosas hacen que Next vuelva a renderizar la ruta
    // actual en la misma respuesta de la acción. Y "/solicitar" ahora redirige
    // a "/resumen" (ya hay una solicitud activa), así que el estudiante nunca
    // llegaría a ver la confirmación de lo que acaba de enviar. El botón "Ver
    // mi solicitud" hace una navegación completa y ahí sí se refresca todo.
    return { fase: "enviada", solicitud, errores: {}, mensaje: null };
  } catch (error) {
    const fallo = comoErrorDeApi(error);
    return {
      fase: "editando",
      solicitud: null,
      errores: fallo.esValidacion ? fallo.erroresPorCampo() : {},
      mensaje: fallo.esValidacion ? null : fallo.message,
    };
  }
}

/** Aprueba o rechaza una solicitud. Solo el analista llega acá. */
export async function resolverSolicitud(
  _previo: EstadoDeResolucion,
  formData: FormData,
): Promise<EstadoDeResolucion> {
  const sesion = await leerSesion();
  if (!sesion || sesion.rol !== "admin") {
    return { mensaje: "Solo un analista puede resolver una solicitud." };
  }

  const id = textoDeFormulario(formData, "id");
  const estado = textoDeFormulario(formData, "estado");
  if (Solicitud.validarEstado(estado) !== null) {
    return { mensaje: "El estado indicado no es válido." };
  }

  try {
    await cambiarEstadoDeSolicitud(sesion.id, id, estado as EstadoSolicitud);
    revalidatePath("/creditos");
    revalidatePath(`/creditos/${id}`);
    return { mensaje: null };
  } catch (error) {
    return { mensaje: comoErrorDeApi(error).message };
  }
}
