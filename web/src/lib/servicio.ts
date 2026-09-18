/**
 * Un método por endpoint del contrato de la API. Es la única capa que conoce
 * las rutas; páginas y acciones hablan con funciones con nombre de negocio.
 */
import { pedirJson } from "./api";
import type {
  FiltroDeSolicitudes,
  PaginaDTO,
  SolicitudDTO,
  UsuarioDTO,
} from "./tipos";
import type { EstadoSolicitud } from "@/dominio";

/**
 * Postgres devuelve `numeric` como texto y TypeORM lo respeta. Normalizar acá
 * evita que un "3000.00" llegue como string a `Intl.NumberFormat` o al cálculo
 * de la cuota.
 */
function comoNumero(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  if (typeof valor === "string") {
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : 0;
  }
  return 0;
}

type SolicitudCruda = Omit<
  SolicitudDTO,
  "monto" | "plazoMeses" | "tasaAnual" | "cuotaMensual"
> & {
  monto: unknown;
  plazoMeses: unknown;
  tasaAnual: unknown;
  cuotaMensual: unknown;
};

function normalizarSolicitud(cruda: SolicitudCruda): SolicitudDTO {
  return {
    ...cruda,
    monto: comoNumero(cruda.monto),
    plazoMeses: comoNumero(cruda.plazoMeses),
    tasaAnual: comoNumero(cruda.tasaAnual),
    cuotaMensual: comoNumero(cruda.cuotaMensual),
  };
}

/**
 * La API envuelve el recurso en la respuesta (`{ usuario }`, `{ solicitud }`)
 * en vez de devolverlo pelado, para poder sumar metadatos más adelante sin
 * romper a quien la consume. Esta capa es la única que conoce ese envoltorio:
 * de acá para arriba se trabaja con el objeto directo.
 */
type SobreDeUsuario = { usuario: UsuarioDTO };
type SobreDeSolicitud = { solicitud: SolicitudCruda };

export interface DatosDeAlta {
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
}

export interface DatosDeSolicitudNueva extends DatosDeAlta {
  monto: number;
  plazoMeses: number;
}

/** POST /auth/ingresar — 404 si el DNI no existe (dispara el alta). */
export async function ingresarPorDni(dni: string): Promise<UsuarioDTO> {
  const sobre = await pedirJson<SobreDeUsuario>("/auth/ingresar", {
    metodo: "POST",
    cuerpo: { dni },
  });
  return sobre.usuario;
}

/** POST /usuarios — 409 si el DNI o el correo ya existen. */
export async function registrarEstudiante(datos: DatosDeAlta): Promise<UsuarioDTO> {
  const sobre = await pedirJson<SobreDeUsuario>("/usuarios", {
    metodo: "POST",
    cuerpo: datos,
  });
  return sobre.usuario;
}

/** POST /solicitudes — 422 por campo, 409 si ya tiene una activa. */
export async function crearSolicitud(
  usuarioId: string,
  datos: DatosDeSolicitudNueva,
): Promise<SolicitudDTO> {
  const sobre = await pedirJson<SobreDeSolicitud>("/solicitudes", {
    metodo: "POST",
    cuerpo: datos,
    usuarioId,
  });
  return normalizarSolicitud(sobre.solicitud);
}

/** GET /solicitudes — solo admin. */
export async function listarSolicitudes(
  usuarioId: string,
  filtro: FiltroDeSolicitudes = {},
): Promise<PaginaDTO<SolicitudDTO>> {
  const pagina = await pedirJson<PaginaDTO<SolicitudCruda>>("/solicitudes", {
    usuarioId,
    busqueda: { estado: filtro.estado, page: filtro.page, limit: filtro.limit },
  });
  return { ...pagina, data: pagina.data.map(normalizarSolicitud) };
}

/**
 * GET /solicitudes/mias — el historial del estudiante, de la más nueva a la
 * más vieja. Llega entero y sin paginar: son unas pocas filas por persona, y
 * paginarlas en el navegador evita un viaje al servidor por cada página.
 */
export async function obtenerMisSolicitudes(
  usuarioId: string,
): Promise<SolicitudDTO[]> {
  const pagina = await pedirJson<PaginaDTO<SolicitudCruda>>("/solicitudes/mias", {
    usuarioId,
  });
  return pagina.data.map(normalizarSolicitud);
}

/** GET /solicitudes/:id — 403 si no es del estudiante ni es admin. */
export async function obtenerSolicitud(
  usuarioId: string,
  id: string,
): Promise<SolicitudDTO> {
  const sobre = await pedirJson<SobreDeSolicitud>(
    `/solicitudes/${encodeURIComponent(id)}`,
    { usuarioId },
  );
  return normalizarSolicitud(sobre.solicitud);
}

/** PATCH /solicitudes/:id/estado — solo admin. */
export async function cambiarEstadoDeSolicitud(
  usuarioId: string,
  id: string,
  estado: EstadoSolicitud,
): Promise<SolicitudDTO> {
  const sobre = await pedirJson<SobreDeSolicitud>(
    `/solicitudes/${encodeURIComponent(id)}/estado`,
    { metodo: "PATCH", cuerpo: { estado }, usuarioId },
  );
  return normalizarSolicitud(sobre.solicitud);
}
