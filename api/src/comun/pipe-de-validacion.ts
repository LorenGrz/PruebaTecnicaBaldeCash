import { ValidationPipe, type ValidationError } from '@nestjs/common';
import { ErrorDeValidacion, type DetalleDeError } from '../dominio/index.js';

export const MENSAJE_DE_VALIDACION = 'La solicitud contiene campos inválidos';

/**
 * Traduce los errores de `class-validator` al mismo detalle por campo que usa
 * el dominio (`{ campo, mensaje }`). Así el cliente recibe una sola forma de
 * error de validación, venga del formato (DTO) o de la regla de negocio.
 */
export function aplanarErrores(
  errores: ValidationError[],
  prefijo = '',
): DetalleDeError[] {
  const detalles: DetalleDeError[] = [];

  for (const error of errores) {
    const campo = `${prefijo}${error.property}`;
    const restricciones = Object.values(error.constraints ?? {});

    if (restricciones.length > 0) {
      detalles.push({ campo, mensaje: restricciones[0] });
    }

    if (error.children && error.children.length > 0) {
      detalles.push(...aplanarErrores(error.children, `${campo}.`));
    }
  }

  return detalles;
}

/**
 * ValidationPipe global. Responde 422 y no 400: el cuerpo llegó bien formado y
 * se entendió, lo que falla es su contenido. El 422 lo produce el filtro al
 * recibir el `ErrorDeValidacion` que se lanza acá.
 */
export function crearPipeDeValidacion(): ValidationPipe {
  return new ValidationPipe({
    // Descarta lo que el DTO no declara en vez de guardarlo por accidente.
    whitelist: true,
    transform: true,
    // Un mensaje por campo: el formulario pinta un error debajo de cada input.
    stopAtFirstError: true,
    exceptionFactory: (errores: ValidationError[]) =>
      new ErrorDeValidacion(MENSAJE_DE_VALIDACION, aplanarErrores(errores)),
  });
}
