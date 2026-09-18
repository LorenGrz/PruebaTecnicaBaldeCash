import { Controller, Get } from '@nestjs/common';
import { Publico } from './auth/publico.decorador.js';

@Controller('salud')
export class AppController {
  /** Chequeo de vida para el docker-compose: no necesita identidad. */
  @Publico()
  @Get()
  verificar(): { estado: string } {
    return { estado: 'ok' };
  }
}
