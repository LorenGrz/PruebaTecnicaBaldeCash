import {
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

/**
 * El formulario manda los datos personales junto con el pedido: son editables
 * y pueden haber cambiado desde el alta.
 *
 * Acá solo se valida formato, tipo y presencia. El rango del monto y los
 * plazos permitidos son reglas del negocio y las aplica `Solicitud`: si se
 * copiaran como decoradores habría dos definiciones de lo mismo, y la del DTO
 * se olvidaría de actualizar.
 */
export class CrearSolicitudDto {
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

  @IsNumber(
    { allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 },
    { message: 'El monto debe ser un número con hasta 2 decimales' },
  )
  monto!: number;

  @IsInt({ message: 'El plazo debe ser un número entero de meses' })
  plazoMeses!: number;
}
