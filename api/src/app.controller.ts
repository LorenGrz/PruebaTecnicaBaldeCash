import { Controller, Get } from '@nestjs/common';

@Controller('salud')
export class AppController {
  @Get()
  verificar(): { estado: string } {
    return { estado: 'ok' };
  }
}
