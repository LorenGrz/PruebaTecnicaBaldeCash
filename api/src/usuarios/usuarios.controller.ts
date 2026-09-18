import { Body, Controller, Post } from '@nestjs/common';
import { Publico } from '../auth/publico.decorador.js';
import { CrearUsuarioDto } from './dto/index.js';
import {
  aRespuestaDeUsuario,
  type RespuestaDeUsuario,
} from './usuarios.presentador.js';
import { UsuariosService } from './usuarios.service.js';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly servicio: UsuariosService) {}

  /**
   * Alta de estudiante. Es pública porque es la contracara del ingreso: quien
   * escribe un DNI que no existe termina acá, todavía sin identidad.
   */
  @Publico()
  @Post()
  async crear(
    @Body() datos: CrearUsuarioDto,
  ): Promise<{ usuario: RespuestaDeUsuario }> {
    const usuario = await this.servicio.registrar(datos);
    return { usuario: aRespuestaDeUsuario(usuario) };
  }
}
