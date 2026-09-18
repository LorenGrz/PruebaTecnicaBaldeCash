import {
  ErrorDeConflicto,
  ErrorDePermiso,
  ErrorDeValidacion,
  type DetalleDeError,
} from './errores.js';
import type { Usuario } from './usuario.js';

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada';

export interface DatosDeSolicitud {
  id?: string;
  usuarioId: string;
  monto: number;
  plazoMeses: number;
  tasaAnual: number;
  cuotaMensual?: number;
  estado?: EstadoSolicitud;
  creadoEn?: Date;
  actualizadoEn?: Date;
}

/**
 * Una solicitud de financiamiento. Concentra las reglas del producto: cuánto se
 * puede pedir, a qué plazo, cuánto se paga por mes y quién puede verla o
 * resolverla.
 *
 * Clase de dominio pura, replicada tal cual en el frontend: el formulario
 * calcula la cuota estimada y valida con este mismo código, y la API vuelve a
 * validar sin confiar en el cliente.
 */
export class Solicitud {
  static readonly MONTO_MIN = 1000;
  static readonly MONTO_MAX = 10000;
  static readonly PLAZOS_PERMITIDOS: readonly number[] = [6, 12, 18, 24];
  static readonly ESTADOS: readonly EstadoSolicitud[] = ['pendiente', 'aprobada', 'rechazada'];

  readonly id?: string;
  readonly usuarioId: string;
  readonly monto: number;
  readonly plazoMeses: number;
  readonly tasaAnual: number;
  readonly cuotaMensual: number;
  private _estado: EstadoSolicitud;
  readonly creadoEn?: Date;
  actualizadoEn?: Date;

  private constructor(datos: DatosDeSolicitud) {
    this.id = datos.id;
    this.usuarioId = datos.usuarioId;
    this.monto = datos.monto;
    this.plazoMeses = datos.plazoMeses;
    this.tasaAnual = datos.tasaAnual;
    this.cuotaMensual =
      datos.cuotaMensual ??
      Solicitud.calcularCuota(datos.monto, datos.plazoMeses, datos.tasaAnual);
    this._estado = datos.estado ?? 'pendiente';
    this.creadoEn = datos.creadoEn;
    this.actualizadoEn = datos.actualizadoEn;
  }

  get estado(): EstadoSolicitud {
    return this._estado;
  }

  /**
   * Cuota fija del sistema de amortización francés:
   *
   *     cuota = P * ( i * (1 + i)^n ) / ( (1 + i)^n - 1 )
   *
   * P = monto financiado · n = cuotas en meses · i = tasa mensual (anual / 12).
   * Se redondea a 2 decimales, que es la unidad mínima en soles.
   */
  static calcularCuota(monto: number, plazoMeses: number, tasaAnual: number): number {
    const tasaMensual = tasaAnual / 12;

    // Sin interés la fórmula se indetermina (0/0): el capital se reparte parejo.
    if (tasaMensual === 0) return Solicitud.redondear(monto / plazoMeses);

    const factor = Math.pow(1 + tasaMensual, plazoMeses);
    const cuota = (monto * (tasaMensual * factor)) / (factor - 1);
    return Solicitud.redondear(cuota);
  }

  private static redondear(valor: number): number {
    return Math.round((valor + Number.EPSILON) * 100) / 100;
  }

  static validarMonto(monto: unknown): string | null {
    if (typeof monto !== 'number' || Number.isNaN(monto)) return 'El monto es obligatorio';
    if (!Number.isFinite(monto)) return 'El monto no es un número válido';
    if (monto < Solicitud.MONTO_MIN || monto > Solicitud.MONTO_MAX) {
      return `El monto debe estar entre S/ ${Solicitud.MONTO_MIN.toLocaleString('es-PE')} y S/ ${Solicitud.MONTO_MAX.toLocaleString('es-PE')}`;
    }
    return null;
  }

  static validarPlazo(plazoMeses: unknown): string | null {
    if (typeof plazoMeses !== 'number' || Number.isNaN(plazoMeses)) {
      return 'El plazo es obligatorio';
    }
    if (!Solicitud.PLAZOS_PERMITIDOS.includes(plazoMeses)) {
      return `El plazo debe ser ${Solicitud.PLAZOS_PERMITIDOS.join(', ')} meses`;
    }
    return null;
  }

  static validarEstado(estado: unknown): string | null {
    if (typeof estado !== 'string' || !Solicitud.ESTADOS.includes(estado as EstadoSolicitud)) {
      return `El estado debe ser ${Solicitud.ESTADOS.join(', ')}`;
    }
    return null;
  }

  /** Valida, calcula la cuota y deja la solicitud en `pendiente`. */
  static crear(datos: {
    usuario: Usuario;
    monto: number;
    plazoMeses: number;
    tasaAnual: number;
  }): Solicitud {
    const detalles: DetalleDeError[] = [];
    const revisar = (campo: string, mensaje: string | null) => {
      if (mensaje) detalles.push({ campo, mensaje });
    };

    revisar('monto', Solicitud.validarMonto(datos.monto));
    revisar('plazoMeses', Solicitud.validarPlazo(datos.plazoMeses));

    if (detalles.length > 0) {
      throw new ErrorDeValidacion('Los datos de la solicitud son inválidos', detalles);
    }

    if (!datos.usuario.puedeSolicitarFinanciamiento()) {
      throw new ErrorDePermiso('Solo un estudiante puede solicitar financiamiento');
    }

    if (!datos.usuario.id) {
      throw new ErrorDeConflicto(
        'El estudiante debe existir antes de crear su solicitud',
        'USUARIO_SIN_ID',
      );
    }

    return new Solicitud({
      usuarioId: datos.usuario.id,
      monto: datos.monto,
      plazoMeses: datos.plazoMeses,
      tasaAnual: datos.tasaAnual,
      estado: 'pendiente',
    });
  }

  /** Reconstruye una solicitud ya persistida, sin revalidar ni recalcular. */
  static desdePersistencia(datos: Required<Pick<DatosDeSolicitud, 'id' | 'cuotaMensual' | 'estado'>> & DatosDeSolicitud): Solicitud {
    return new Solicitud(datos);
  }

  /** Ocupa el cupo del estudiante: no puede tener dos así a la vez. */
  estaActiva(): boolean {
    return this._estado === 'pendiente' || this._estado === 'aprobada';
  }

  /** Un rechazo no es una puerta cerrada: habilita una solicitud nueva. */
  permiteReenvio(): boolean {
    return this._estado === 'rechazada';
  }

  esVisiblePara(usuario: Usuario): boolean {
    return usuario.puedeGestionarSolicitudes() || usuario.id === this.usuarioId;
  }

  aprobar(porUsuario: Usuario): void {
    this.cambiarEstado('aprobada', porUsuario);
  }

  rechazar(porUsuario: Usuario): void {
    this.cambiarEstado('rechazada', porUsuario);
  }

  cambiarEstado(nuevoEstado: EstadoSolicitud, porUsuario: Usuario): void {
    if (!porUsuario.puedeGestionarSolicitudes()) {
      throw new ErrorDePermiso('Solo un administrador puede cambiar el estado de una solicitud');
    }

    const mensaje = Solicitud.validarEstado(nuevoEstado);
    if (mensaje) {
      throw new ErrorDeValidacion('El estado indicado no es válido', [
        { campo: 'estado', mensaje },
      ]);
    }

    // Una solicitud se resuelve una sola vez: de pendiente sale, pero no vuelve.
    if (this._estado !== 'pendiente') {
      throw new ErrorDeConflicto(
        `La solicitud ya fue ${this._estado} y no puede volver a cambiar de estado`,
        'TRANSICION_INVALIDA',
      );
    }

    if (nuevoEstado === 'pendiente') {
      throw new ErrorDeConflicto(
        'La solicitud ya está pendiente',
        'TRANSICION_INVALIDA',
      );
    }

    this._estado = nuevoEstado;
    this.actualizadoEn = new Date();
  }
}
