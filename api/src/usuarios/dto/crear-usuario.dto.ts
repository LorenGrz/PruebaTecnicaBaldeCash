import { IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength } from 'class-validator';

/**
 * Formato, tipo y presencia. Nada más: el rango de un monto o la unicidad de
 * un DNI no son formato, y viven en el dominio y en la base.
 */
export class CrearUsuarioDto {
  @IsString({ message: 'El nombre es obligatorio' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Length(3, 120, { message: 'El nombre debe tener entre 3 y 120 caracteres' })
  nombre!: string;

  @IsString({ message: 'El DNI es obligatorio' })
  @Matches(/^\d{8}$/, {
    message: 'El DNI debe tener exactamente 8 dígitos numéricos',
  })
  dni!: string;

  @IsString({ message: 'El correo es obligatorio' })
  @IsEmail({}, { message: 'El correo no tiene un formato válido' })
  @MaxLength(160, { message: 'El correo no puede superar los 160 caracteres' })
  email!: string;

  @IsString({ message: 'El teléfono es obligatorio' })
  @Matches(/^9\d{8}$/, {
    message: 'El teléfono debe tener 9 dígitos y empezar en 9',
  })
  telefono!: string;
}
