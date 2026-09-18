import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ErrorNoEncontrado } from '../comun/index.js';
import { IngresarDto } from '../usuarios/dto/index.js';
import {
  aRespuestaDeUsuario,
  type RespuestaDeUsuario,
} from '../usuarios/usuarios.presentador.js';
import { UsuariosService } from '../usuarios/usuarios.service.js';
import { Publico } from './publico.decorador.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly usuarios: UsuariosService) {}

  /**
   * Ingreso por DNI. Devuelve 200 y no 201 porque no crea nada: busca a quien
   * ya existe. Si el DNI no está registrado responde 404 con un código que el
   * frontend usa para ofrecer el alta en la misma pantalla.
   */
  @Publico()
  @Post('ingresar')
  @HttpCode(HttpStatus.OK)
  async ingresar(
    @Body() datos: IngresarDto,
  ): Promise<{ usuario: RespuestaDeUsuario }> {
    const usuario = await this.usuarios.buscarPorDni(datos.dni);

    if (!usuario) {
      throw new ErrorNoEncontrado(
        'No hay ningún usuario registrado con ese DNI',
        'USUARIO_NO_ENCONTRADO',
      );
    }

    return { usuario: aRespuestaDeUsuario(usuario) };
  }
}
