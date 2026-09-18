import type { EstadoSolicitud, Solicitud, Usuario } from '../dominio/index.js';

export interface RespuestaDeSolicitud {
  id: string;
  usuarioId: string;
  monto: number;
  plazoMeses: number;
  tasaAnual: number;
  cuotaMensual: number;
  estado: EstadoSolicitud;
  creadoEn: string | null;
  actualizadoEn: string | null;
  estudiante: {
    id: string;
    nombre: string;
    dni: string;
    email: string;
    telefono: string;
  };
}

/**
 * `Solicitud` guarda el estado en un campo privado con getter, así que
 * serializarla directo publicaría `_estado` y no `estado`. El presentador fija
 * el contrato de salida en un solo lugar.
 */
export function aRespuestaDeSolicitud(
  solicitud: Solicitud,
  estudiante: Usuario,
): RespuestaDeSolicitud {
  if (!solicitud.id || !estudiante.id) {
    throw new Error('Solo se presentan solicitudes ya persistidas');
  }

  return {
    id: solicitud.id,
    usuarioId: solicitud.usuarioId,
    monto: solicitud.monto,
    plazoMeses: solicitud.plazoMeses,
    tasaAnual: solicitud.tasaAnual,
    cuotaMensual: solicitud.cuotaMensual,
    estado: solicitud.estado,
    creadoEn: solicitud.creadoEn?.toISOString() ?? null,
    actualizadoEn: solicitud.actualizadoEn?.toISOString() ?? null,
    // El analista de créditos necesita el contacto del estudiante para
    // evaluar la solicitud; viene embebido para no obligar a una segunda
    // llamada por cada fila del listado.
    estudiante: {
      id: estudiante.id,
      nombre: estudiante.nombre,
      dni: estudiante.dni,
      email: estudiante.email,
      telefono: estudiante.telefono,
    },
  };
}
