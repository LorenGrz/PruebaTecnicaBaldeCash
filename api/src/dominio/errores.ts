/**
 * Errores del dominio. No conocen HTTP: la capa de infraestructura los traduce
 * a códigos de estado (ver `comun/filtro-de-excepciones`).
 */

export interface DetalleDeError {
  campo: string;
  mensaje: string;
}

export class ErrorDeDominio extends Error {
  constructor(
    mensaje: string,
    readonly codigo: string,
  ) {
    super(mensaje);
    this.name = new.target.name;
  }
}

/** Uno o más campos no cumplen las reglas del negocio. Se traduce a 422. */
export class ErrorDeValidacion extends ErrorDeDominio {
  constructor(
    mensaje: string,
    readonly detalles: DetalleDeError[],
  ) {
    super(mensaje, 'VALIDACION_FALLIDA');
  }
}

/** La operación es válida pero choca con el estado actual. Se traduce a 409. */
export class ErrorDeConflicto extends ErrorDeDominio {
  constructor(mensaje: string, codigo: string) {
    super(mensaje, codigo);
  }
}

/** Quien pide la operación no tiene permiso para hacerla. Se traduce a 403. */
export class ErrorDePermiso extends ErrorDeDominio {
  constructor(mensaje: string) {
    super(mensaje, 'SIN_PERMISO');
  }
}
