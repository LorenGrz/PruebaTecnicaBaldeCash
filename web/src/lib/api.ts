/**
 * Cliente HTTP tipado contra la API de BaldeCash.
 *
 * Toda respuesta que no sea 2xx se convierte en un `ErrorDeApi` con un mensaje
 * listo para mostrar y, cuando es un 422, con el detalle por campo. La regla
 * del proyecto es que el usuario nunca lea "algo salió mal".
 */
import type { DetalleDeErrorDTO, ErrorDTO, ErroresPorCampo } from "./tipos";

/** Estado ficticio para "no hubo respuesta": la API está caída o no existe. */
export const SIN_RESPUESTA = 0;

const MENSAJES_POR_ESTADO: Record<number, string> = {
  400: "La petición no es válida.",
  403: "No tienes permiso para ver o modificar esta solicitud.",
  404: "No encontramos lo que buscabas.",
  409: "La operación choca con el estado actual de los datos.",
  422: "Revisa los campos marcados.",
  500: "El servicio de BaldeCash tuvo un problema. Intenta de nuevo en unos minutos.",
};

export class ErrorDeApi extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
    readonly detalles: DetalleDeErrorDTO[] = [],
    readonly codigo?: string,
  ) {
    super(mensaje);
    this.name = "ErrorDeApi";
  }

  get esValidacion(): boolean {
    return this.estado === 422;
  }

  get esSinConexion(): boolean {
    return this.estado === SIN_RESPUESTA;
  }

  /** Detalles del 422 listos para pintar debajo de cada input. */
  erroresPorCampo(): ErroresPorCampo {
    const errores: ErroresPorCampo = {};
    for (const detalle of this.detalles) errores[detalle.campo] = detalle.mensaje;
    return errores;
  }
}

/**
 * En el navegador siempre se usa la URL pública. En el servidor (componentes y
 * server actions) se permite una URL interna distinta, porque dentro de Docker
 * la API no vive en `localhost`.
 */
function urlBase(): string {
  const publica = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
  if (typeof window !== "undefined") return publica;
  return process.env.API_URL_INTERNA ?? publica;
}

interface OpcionesDePeticion {
  metodo?: "GET" | "POST" | "PATCH";
  cuerpo?: unknown;
  /** Identidad del usuario: viaja en `x-usuario-id`. Reemplaza al JWT. */
  usuarioId?: string;
  busqueda?: Record<string, string | number | undefined>;
}

function construirUrl(ruta: string, busqueda?: OpcionesDePeticion["busqueda"]): string {
  const url = new URL(`${urlBase().replace(/\/$/, "")}${ruta}`);
  for (const [clave, valor] of Object.entries(busqueda ?? {})) {
    if (valor !== undefined && valor !== "") url.searchParams.set(clave, String(valor));
  }
  return url.toString();
}

function esErrorDTO(cuerpo: unknown): cuerpo is ErrorDTO {
  return typeof cuerpo === "object" && cuerpo !== null;
}

async function leerCuerpo(respuesta: Response): Promise<unknown> {
  const texto = await respuesta.text();
  if (texto.length === 0) return null;
  try {
    return JSON.parse(texto) as unknown;
  } catch {
    return { mensaje: texto } satisfies ErrorDTO;
  }
}

async function errorDesde(respuesta: Response): Promise<ErrorDeApi> {
  const cuerpo = await leerCuerpo(respuesta);
  const datos: ErrorDTO = esErrorDTO(cuerpo) ? cuerpo : {};
  const mensaje =
    datos.mensaje ??
    MENSAJES_POR_ESTADO[respuesta.status] ??
    `El servicio respondió ${respuesta.status}.`;
  return new ErrorDeApi(respuesta.status, mensaje, datos.detalles ?? [], datos.codigo);
}

/** Petición cruda. Devuelve `null` ante un 204. Lanza `ErrorDeApi` si no es 2xx. */
async function pedir(ruta: string, opciones: OpcionesDePeticion = {}): Promise<unknown> {
  const cabeceras: Record<string, string> = { Accept: "application/json" };
  if (opciones.cuerpo !== undefined) cabeceras["Content-Type"] = "application/json";
  // SIMPLIFICACIÓN: la identidad viaja en texto plano, sin firmar. Con auth real
  // esto sería un `Authorization: Bearer <jwt>`; el resto del cliente no cambia.
  if (opciones.usuarioId) cabeceras["x-usuario-id"] = opciones.usuarioId;

  let respuesta: Response;
  try {
    respuesta = await fetch(construirUrl(ruta, opciones.busqueda), {
      method: opciones.metodo ?? "GET",
      headers: cabeceras,
      body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
      cache: "no-store",
    });
  } catch {
    throw new ErrorDeApi(
      SIN_RESPUESTA,
      "No pudimos conectarnos con el servicio de BaldeCash. Verifica que la API esté levantada.",
      [],
      "SIN_CONEXION",
    );
  }

  if (!respuesta.ok) throw await errorDesde(respuesta);
  if (respuesta.status === 204) return null;
  return leerCuerpo(respuesta);
}

/** Petición que exige cuerpo en la respuesta. */
export async function pedirJson<T>(ruta: string, opciones?: OpcionesDePeticion): Promise<T> {
  const cuerpo = await pedir(ruta, opciones);
  if (cuerpo === null) {
    throw new ErrorDeApi(SIN_RESPUESTA, "El servicio respondió vacío cuando se esperaba contenido.");
  }
  return cuerpo as T;
}

/** Petición donde el 204 es una respuesta legítima (`/solicitudes/mia`). */
export async function pedirJsonOpcional<T>(
  ruta: string,
  opciones?: OpcionesDePeticion,
): Promise<T | null> {
  return (await pedir(ruta, opciones)) as T | null;
}

/** Convierte cualquier excepción en un `ErrorDeApi` presentable. */
export function comoErrorDeApi(error: unknown): ErrorDeApi {
  if (error instanceof ErrorDeApi) return error;
  return new ErrorDeApi(
    500,
    "Ocurrió un problema inesperado al hablar con el servicio de BaldeCash.",
  );
}
