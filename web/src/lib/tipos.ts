/**
 * Contratos de transporte (DTO) de la API de BaldeCash.
 *
 * Deliberadamente separados de las clases de `src/dominio`: lo que viaja por
 * HTTP es JSON plano (fechas en ISO, números que pueden llegar como texto), y
 * las clases de dominio son objetos con comportamiento. Mezclarlos obligaría a
 * ensuciar el dominio con detalles del transporte.
 */
import type { EstadoSolicitud, RolUsuario } from "@/dominio";

export interface UsuarioDTO {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  /** `null` en cuentas creadas antes de que se pidiera la dirección. */
  direccion: string | null;
  rol: RolUsuario;
  creadoEn?: string;
}

/** Datos del estudiante embebidos en una solicitud. */
export interface EstudianteDTO {
  id: string;
  nombre: string;
  dni: string;
  email: string;
  telefono: string;
  /** La dirección actual del estudiante. */
  direccion: string | null;
}

export interface SolicitudDTO {
  id: string;
  usuarioId: string;
  monto: number;
  plazoMeses: number;
  tasaAnual: number;
  cuotaMensual: number;
  /**
   * La dirección con la que se pidió: puede diferir de `estudiante.direccion`
   * si después se mudó. `null` en solicitudes anteriores al campo.
   */
  direccion: string | null;
  estado: EstadoSolicitud;
  creadoEn: string;
  actualizadoEn?: string;
  /**
   * La API embebe al estudiante en el listado y en el detalle para poder
   * mostrar "nombre sobre DNI" y su contacto sin una segunda llamada. Es
   * opcional en el tipo a propósito: si algún día no viniera, la interfaz
   * degrada a "—" en vez de romperse.
   */
  estudiante?: EstudianteDTO;
}

export interface PaginaDTO<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DetalleDeErrorDTO {
  campo: string;
  mensaje: string;
}

/** Forma del cuerpo de error que devuelve el ExceptionFilter de la API. */
export interface ErrorDTO {
  statusCode?: number;
  error?: string;
  mensaje?: string;
  codigo?: string;
  detalles?: DetalleDeErrorDTO[];
}

/** Errores de un formulario indexados por nombre de campo. */
export type ErroresPorCampo = Partial<Record<string, string>>;

export interface FiltroDeSolicitudes {
  estado?: EstadoSolicitud;
  page?: number;
  limit?: number;
}
