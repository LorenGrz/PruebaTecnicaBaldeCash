/** Puente entre el DTO que viaja por HTTP y la clase de dominio. */
import { Solicitud } from "@/dominio";
import type { SolicitudDTO } from "./tipos";

/**
 * Rehidrata la solicitud como objeto de dominio para poder preguntarle cosas
 * (`estaActiva`, `permiteReenvio`) en vez de repetir la regla en la interfaz.
 */
export function comoSolicitudDeDominio(dto: SolicitudDTO): Solicitud {
  return Solicitud.desdePersistencia({
    id: dto.id,
    usuarioId: dto.usuarioId,
    monto: dto.monto,
    plazoMeses: dto.plazoMeses,
    tasaAnual: dto.tasaAnual,
    cuotaMensual: dto.cuotaMensual,
    estado: dto.estado,
    creadoEn: new Date(dto.creadoEn),
  });
}
