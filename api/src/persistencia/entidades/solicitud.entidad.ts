import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { EstadoSolicitud } from '../../dominio/index.js';
import { UsuarioEntidad } from './usuario.entidad.js';

/**
 * El driver de Postgres devuelve `numeric` como string para no perder
 * precisión. Como acá los importes son chicos y acotados, se convierten a
 * number en el borde para que el dominio trabaje siempre con números.
 */
const aNumero = {
  to: (valor: number): number => valor,
  from: (valor: string | number | null): number =>
    valor === null ? 0 : typeof valor === 'number' ? valor : Number(valor),
};

@Entity({ name: 'solicitudes' })
export class SolicitudEntidad {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index('idx_solicitudes_usuario')
  @Column({ name: 'usuario_id', type: 'uuid' })
  usuarioId!: string;

  @ManyToOne(() => UsuarioEntidad, (usuario) => usuario.solicitudes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario?: UsuarioEntidad;

  @Column({ type: 'numeric', precision: 10, scale: 2, transformer: aNumero })
  monto!: number;

  @Column({ name: 'plazo_meses', type: 'smallint' })
  plazoMeses!: number;

  @Column({
    name: 'tasa_anual',
    type: 'numeric',
    precision: 5,
    scale: 4,
    transformer: aNumero,
  })
  tasaAnual!: number;

  @Column({
    name: 'cuota_mensual',
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: aNumero,
  })
  cuotaMensual!: number;

  @Index('idx_solicitudes_estado')
  @Column({ type: 'varchar', length: 20, default: 'pendiente' })
  estado!: EstadoSolicitud;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;

  @UpdateDateColumn({ name: 'actualizado_en', type: 'timestamptz' })
  actualizadoEn!: Date;
}
