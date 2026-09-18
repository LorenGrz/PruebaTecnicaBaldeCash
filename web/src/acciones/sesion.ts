"use server";

import { redirect } from "next/navigation";
import { Usuario } from "@/dominio";
import { comoErrorDeApi } from "@/lib/api";
import { ingresarPorDni, registrarEstudiante } from "@/lib/servicio";
import { INICIO_POR_ROL, borrarSesion, guardarSesion, sesionDesdeUsuario } from "@/lib/sesion";
import type { ErroresPorCampo, UsuarioDTO } from "@/lib/tipos";
import {
  type EstadoDeIngreso,
  textoDeFormulario,
} from "./estados";

/**
 * El dominio decide SI el DNI es válido; esta pantalla decide cómo contárselo
 * al usuario, que en el ingreso solo necesita saber el formato esperado.
 */
const DNI_INVALIDO = "Ingresa 8 dígitos numéricos";

type Resultado =
  | { ok: true; usuario: UsuarioDTO }
  | { ok: false; estado: EstadoDeIngreso };

async function intentarIngreso(dni: string): Promise<Resultado> {
  const base: EstadoDeIngreso = {
    modo: "ingreso",
    dni,
    valores: { nombre: "", email: "", telefono: "" },
    errores: {},
    mensaje: null,
  };

  if (Usuario.validarDni(dni) !== null) {
    return { ok: false, estado: { ...base, errores: { dni: DNI_INVALIDO } } };
  }

  try {
    return { ok: true, usuario: await ingresarPorDni(dni) };
  } catch (error) {
    const fallo = comoErrorDeApi(error);
    // El DNI no existe: la misma tarjeta se convierte en el alta del estudiante.
    if (fallo.estado === 404) return { ok: false, estado: { ...base, modo: "alta" } };
    return { ok: false, estado: { ...base, mensaje: fallo.message } };
  }
}

async function intentarAlta(formData: FormData): Promise<Resultado> {
  const dni = textoDeFormulario(formData, "dni");
  const valores = {
    nombre: textoDeFormulario(formData, "nombre"),
    email: textoDeFormulario(formData, "email"),
    telefono: textoDeFormulario(formData, "telefono"),
  };
  const base: EstadoDeIngreso = { modo: "alta", dni, valores, errores: {}, mensaje: null };

  // Las mismas reglas que corre la API: una sola definición de "usuario válido".
  const errores: ErroresPorCampo = {};
  const revisar = (campo: string, mensaje: string | null) => {
    if (mensaje) errores[campo] = mensaje;
  };
  revisar("nombre", Usuario.validarNombre(valores.nombre));
  revisar("dni", Usuario.validarDni(dni));
  revisar("email", Usuario.validarEmail(valores.email));
  revisar("telefono", Usuario.validarTelefono(valores.telefono));

  if (Object.keys(errores).length > 0) return { ok: false, estado: { ...base, errores } };

  try {
    return { ok: true, usuario: await registrarEstudiante({ ...valores, dni }) };
  } catch (error) {
    const fallo = comoErrorDeApi(error);
    if (fallo.esValidacion) {
      return { ok: false, estado: { ...base, errores: fallo.erroresPorCampo() } };
    }
    return { ok: false, estado: { ...base, mensaje: fallo.message } };
  }
}

/**
 * Una sola acción para las dos fases de la tarjeta de ingreso: pedir el DNI y,
 * si no existe, crear la cuenta. El campo oculto `modo` indica cuál corre.
 */
export async function ingresarOAlta(
  _previo: EstadoDeIngreso,
  formData: FormData,
): Promise<EstadoDeIngreso> {
  const modo = textoDeFormulario(formData, "modo") === "alta" ? "alta" : "ingreso";
  const resultado =
    modo === "alta"
      ? await intentarAlta(formData)
      : await intentarIngreso(textoDeFormulario(formData, "dni"));

  if (!resultado.ok) return resultado.estado;

  await guardarSesion(sesionDesdeUsuario(resultado.usuario));
  // `redirect` lanza: va fuera de todo try/catch.
  redirect(modo === "alta" ? "/solicitar" : INICIO_POR_ROL[resultado.usuario.rol]);
}

export async function cerrarSesion(): Promise<void> {
  await borrarSesion();
  redirect("/ingreso");
}
