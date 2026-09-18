import { IsNotEmpty, IsString } from 'class-validator';

/**
 * Solo exige que venga un estado en texto. Qué estados existen y desde cuál se
 * puede pasar a cuál lo decide `Solicitud`, que es donde vive la máquina de
 * estados.
 */
export class CambiarEstadoDto {
  @IsString({ message: 'El estado es obligatorio' })
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  estado!: string;
}
