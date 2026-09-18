import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorNoAutenticado, esUuid } from '../comun/index.js';
import { UsuariosRepositorio } from '../usuarios/usuarios.repositorio.js';
import { CABECERA_DE_IDENTIDAD, type PeticionConUsuario } from './peticion.js';
import { ES_PUBLICO } from './publico.decorador.js';

/**
 * SIMPLIFICACIÓN: la identidad viaja en la cabecera `x-usuario-id` y este guard
 * la resuelve contra la tabla de usuarios. No hay contraseña, token ni firma:
 * cualquiera que conozca un id puede hacerse pasar por ese usuario, algo
 * inaceptable fuera de una prueba técnica.
 *
 * Es deliberado y está acotado a este archivo. La prueba se evalúa en unas
 * pocas horas y ninguno de sus criterios premia la autenticación; un JWT sin
 * expiración ni refresh sería peor, porque aparenta seguridad donde no la hay.
 *
 * Este es exactamente el punto donde entraría la verificación real: validar el
 * token, leer el `sub` y resolver el usuario igual que acá. Ni los servicios ni
 * los controladores cambiarían, porque de acá para adentro todos reciben un
 * `Usuario` de dominio con su rol.
 */
@Injectable()
export class GuardDeIdentidad implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usuarios: UsuariosRepositorio,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);
    if (esPublico) return true;

    const peticion = contexto.switchToHttp().getRequest<PeticionConUsuario>();
    const cabecera = peticion.headers[CABECERA_DE_IDENTIDAD];
    const id = Array.isArray(cabecera) ? cabecera[0] : cabecera;

    if (!id || !esUuid(id)) {
      throw new ErrorNoAutenticado(
        `Falta la cabecera ${CABECERA_DE_IDENTIDAD} o no tiene un id válido`,
        'SIN_IDENTIDAD',
      );
    }

    const usuario = await this.usuarios.buscarPorId(id);
    if (!usuario) {
      throw new ErrorNoAutenticado(
        'La identidad recibida no corresponde a ningún usuario',
        'IDENTIDAD_INVALIDA',
      );
    }

    peticion.usuarioActual = usuario;
    return true;
  }
}
