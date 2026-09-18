import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Errores de transporte: el dominio no sabe que algo "no se encontró" ni que
 * "falta la identidad", eso lo sabe la capa HTTP. Todos llevan un `codigo`
 * estable para que el cliente decida qué hacer sin leer el mensaje.
 */

export class ErrorNoEncontrado extends HttpException {
  constructor(mensaje: string, codigo: string) {
    super({ error: 'NoEncontrado', mensaje, codigo }, HttpStatus.NOT_FOUND);
  }
}

export class ErrorNoAutenticado extends HttpException {
  constructor(mensaje: string, codigo: string) {
    super({ error: 'NoAutenticado', mensaje, codigo }, HttpStatus.UNAUTHORIZED);
  }
}
