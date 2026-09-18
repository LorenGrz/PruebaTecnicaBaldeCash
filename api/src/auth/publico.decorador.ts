import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICO = 'es_publico';

/**
 * Marca una ruta como abierta: el guard de identidad no se aplica. Son las
 * puertas de entrada (ingresar, alta) y el chequeo de salud.
 */
export const Publico = () => SetMetadata(ES_PUBLICO, true);
