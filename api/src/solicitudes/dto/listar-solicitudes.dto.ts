import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { Solicitud, type EstadoSolicitud } from '../../dominio/index.js';

/** Los parámetros de consulta llegan como texto: `@Type` los convierte. */
export class ListarSolicitudesDto {
  // `?estado=` (vacío) significa "todos", no un estado inválido.
  @Transform(({ value }: { value: unknown }) =>
    value === '' ? undefined : value,
  )
  @IsOptional()
  @IsIn(Solicitud.ESTADOS, {
    message: `El estado debe ser ${Solicitud.ESTADOS.join(', ')}`,
  })
  estado?: EstadoSolicitud;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'La página debe ser un número entero' })
  @Min(1, { message: 'La página mínima es 1' })
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El límite debe ser un número entero' })
  @Min(1, { message: 'El límite mínimo es 1' })
  limit?: number;
}
