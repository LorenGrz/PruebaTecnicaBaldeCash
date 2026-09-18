import type { INestApplication } from '@nestjs/common';
import { FiltroDeExcepciones } from './filtro-de-excepciones.js';
import { crearPipeDeValidacion } from './pipe-de-validacion.js';

/**
 * Configuración compartida por el arranque real y los tests e2e, para que lo
 * que se prueba sea exactamente lo que se despliega.
 */
export function configurarAplicacion(app: INestApplication): void {
  // Todas las rutas cuelgan de /api para no chocar con el frontend.
  app.setGlobalPrefix('api');
  app.useGlobalPipes(crearPipeDeValidacion());
  app.useGlobalFilters(new FiltroDeExcepciones());
}
