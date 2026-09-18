import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import type { RolUsuario } from '../../dominio/index.js';
import { SolicitudEntidad } from './solicitud.entidad.js';

/**
 * Fila de la tabla `usuarios`. Es un objeto de persistencia, no de dominio:
 * no tiene reglas de negocio, solo el mapeo a la base. La lógica vive en la
 * clase `Usuario` y los mapeadores traducen entre ambas.
 */
@Entity({ name: 'usuarios' })
export class UsuarioEntidad {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 120 })
  nombre!: string;

  @Index('idx_usuarios_dni', { unique: true })
  @Column({ type: 'char', length: 8 })
  dni!: string;

  @Index('idx_usuarios_email', { unique: true })
  @Column({ type: 'varchar', length: 160 })
  email!: string;

  @Column({ type: 'char', length: 9 })
  telefono!: string;

  @Column({ type: 'varchar', length: 20, default: 'estudiante' })
  rol!: RolUsuario;

  @CreateDateColumn({ name: 'creado_en', type: 'timestamptz' })
  creadoEn!: Date;

  @OneToMany(() => SolicitudEntidad, (solicitud) => solicitud.usuario)
  solicitudes?: SolicitudEntidad[];
}
