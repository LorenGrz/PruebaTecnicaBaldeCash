import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';
import { esUuid } from '../comun/index.js';
import { ErrorDeConflicto, type Usuario } from '../dominio/index.js';
import {
  UsuarioEntidad,
  aUsuarioDeDominio,
  aUsuarioDeEntidad,
} from '../persistencia/index.js';

/** Código de Postgres para violación de restricción única. */
const UNICIDAD_VIOLADA = '23505';

function esViolacionDeUnicidad(error: unknown): error is QueryFailedError {
  if (!(error instanceof QueryFailedError)) return false;
  const driver = error.driverError as { code?: string } | undefined;
  return driver?.code === UNICIDAD_VIOLADA;
}

/**
 * Habla con la base y devuelve objetos de **dominio**: de acá para adentro
 * nadie ve una entidad de TypeORM. Los mapeadores hacen la traducción.
 */
@Injectable()
export class UsuariosRepositorio {
  constructor(
    @InjectRepository(UsuarioEntidad)
    private readonly filas: Repository<UsuarioEntidad>,
  ) {}

  async buscarPorId(id: string): Promise<Usuario | null> {
    if (!esUuid(id)) return null;
    const fila = await this.filas.findOne({ where: { id } });
    return fila ? aUsuarioDeDominio(fila) : null;
  }

  async buscarPorDni(dni: string): Promise<Usuario | null> {
    const fila = await this.filas.findOne({ where: { dni: dni.trim() } });
    return fila ? aUsuarioDeDominio(fila) : null;
  }

  async buscarPorEmail(email: string): Promise<Usuario | null> {
    const fila = await this.filas.findOne({
      where: { email: email.trim().toLowerCase() },
    });
    return fila ? aUsuarioDeDominio(fila) : null;
  }

  /**
   * Inserta o actualiza. La unicidad la garantiza el índice de la base, no una
   * consulta previa: entre el SELECT y el INSERT puede entrar otra petición.
   */
  async guardar(usuario: Usuario): Promise<Usuario> {
    try {
      const fila = await this.filas.save(
        this.filas.create(aUsuarioDeEntidad(usuario)),
      );

      // Igual que en solicitudes: un UPDATE no devuelve `creado_en`.
      if (!fila.creadoEn && usuario.creadoEn) fila.creadoEn = usuario.creadoEn;

      return aUsuarioDeDominio(fila);
    } catch (error) {
      if (esViolacionDeUnicidad(error)) {
        const duplicado = error.message.includes('email') ? 'email' : 'dni';
        throw duplicado === 'email'
          ? new ErrorDeConflicto(
              'Ya existe un usuario registrado con ese correo',
              'EMAIL_DUPLICADO',
            )
          : new ErrorDeConflicto(
              'Ya existe un usuario registrado con ese DNI',
              'DNI_DUPLICADO',
            );
      }
      throw error;
    }
  }
}
