/**
 * Sesión del usuario que ingresó, guardada en una cookie httpOnly y leída
 * desde los server components.
 *
 * SIMPLIFICACIÓN: la cookie no va firmada ni cifrada. La prueba no incluye
 * contraseñas ni JWT (decisión documentada en el README): el ingreso es por
 * DNI. Con auth real acá iría un token firmado y esta sería la única línea a
 * cambiar, porque todo el resto de la app consume `leerSesion()`.
 *
 * Este módulo es solo de servidor: importa `next/headers`.
 */
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { RolUsuario } from "@/dominio";
import type { UsuarioDTO } from "./tipos";

const NOMBRE_COOKIE = "bc_sesion";
const DURACION_EN_SEGUNDOS = 60 * 60 * 24 * 7;

/**
 * Además de la identidad ({@link Sesion.id}, nombre, rol y DNI) se guardan
 * correo y teléfono: el formulario de solicitud los precarga y la API no
 * expone un endpoint para releerlos.
 */
export interface Sesion {
  id: string;
  nombre: string;
  rol: RolUsuario;
  dni: string;
  email: string;
  telefono: string;
}

export const INICIO_POR_ROL: Record<RolUsuario, string> = {
  admin: "/creditos",
  estudiante: "/resumen",
};

export function sesionDesdeUsuario(usuario: UsuarioDTO): Sesion {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    rol: usuario.rol,
    dni: usuario.dni,
    email: usuario.email,
    telefono: usuario.telefono,
  };
}

function esSesion(valor: unknown): valor is Sesion {
  if (typeof valor !== "object" || valor === null) return false;
  const posible = valor as Record<string, unknown>;
  return (
    typeof posible.id === "string" &&
    typeof posible.nombre === "string" &&
    typeof posible.dni === "string" &&
    typeof posible.email === "string" &&
    typeof posible.telefono === "string" &&
    (posible.rol === "admin" || posible.rol === "estudiante")
  );
}

export async function leerSesion(): Promise<Sesion | null> {
  const cookie = (await cookies()).get(NOMBRE_COOKIE);
  if (!cookie) return null;
  try {
    const json = Buffer.from(cookie.value, "base64url").toString("utf8");
    const valor: unknown = JSON.parse(json);
    return esSesion(valor) ? valor : null;
  } catch {
    // Cookie manipulada o de una versión anterior: se trata como "sin sesión".
    return null;
  }
}

/** Solo puede llamarse desde una server action o un route handler. */
export async function guardarSesion(sesion: Sesion): Promise<void> {
  const valor = Buffer.from(JSON.stringify(sesion), "utf8").toString("base64url");
  (await cookies()).set(NOMBRE_COOKIE, valor, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: DURACION_EN_SEGUNDOS,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function borrarSesion(): Promise<void> {
  (await cookies()).delete(NOMBRE_COOKIE);
}

/** Exige sesión; si no hay, manda al ingreso. */
export async function exigirSesion(): Promise<Sesion> {
  const sesion = await leerSesion();
  if (!sesion) redirect("/ingreso");
  return sesion;
}

/**
 * Bloqueo por rol del lado del servidor. La barra lateral ya oculta lo que no
 * corresponde; esto cubre al que escribe la URL a mano.
 */
export async function exigirRol(rol: RolUsuario): Promise<Sesion> {
  const sesion = await exigirSesion();
  if (sesion.rol !== rol) redirect(INICIO_POR_ROL[sesion.rol]);
  return sesion;
}
