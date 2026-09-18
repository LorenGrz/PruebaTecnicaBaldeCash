import { Solicitud } from '../../dominio/index.js';
import { SolicitudEntidad } from '../entidades/index.js';

/** Fila de `solicitudes` -> objeto de dominio, sin recalcular la cuota. */
export function aSolicitudDeDominio(entidad: SolicitudEntidad): Solicitud {
  return Solicitud.desdePersistencia({
    id: entidad.id,
    usuarioId: entidad.usuarioId,
    monto: entidad.monto,
    plazoMeses: entidad.plazoMeses,
    tasaAnual: entidad.tasaAnual,
    cuotaMensual: entidad.cuotaMensual,
    estado: entidad.estado,
    creadoEn: entidad.creadoEn,
    actualizadoEn: entidad.actualizadoEn,
  });
}

/** Objeto de dominio -> fila de `solicitudes` lista para guardar. */
export function aSolicitudDeEntidad(solicitud: Solicitud): Partial<SolicitudEntidad> {
  return {
    ...(solicitud.id ? { id: solicitud.id } : {}),
    usuarioId: solicitud.usuarioId,
    monto: solicitud.monto,
    plazoMeses: solicitud.plazoMeses,
    tasaAnual: solicitud.tasaAnual,
    cuotaMensual: solicitud.cuotaMensual,
    estado: solicitud.estado,
  };
}
