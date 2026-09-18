import { IsString, Matches } from 'class-validator';

export class IngresarDto {
  @IsString({ message: 'El DNI es obligatorio' })
  @Matches(/^\d{8}$/, {
    message: 'El DNI debe tener exactamente 8 dígitos numéricos',
  })
  dni!: string;
}
