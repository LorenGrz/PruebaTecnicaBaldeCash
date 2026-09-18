import { DataSource, type DataSourceOptions } from 'typeorm';
import { leerConfiguracionDeBase } from '../config/index.js';
import { SolicitudEntidad, UsuarioEntidad } from './entidades/index.js';
import { CreaUsuariosYSolicitudes1758100000000 } from './migraciones/1758100000000-crea-usuarios-y-solicitudes.js';

const base = leerConfiguracionDeBase();

export const opcionesDeBase: DataSourceOptions = {
  type: 'postgres',
  host: base.host,
  port: base.puerto,
  username: base.usuario,
  password: base.password,
  database: base.nombre,
  entities: [UsuarioEntidad, SolicitudEntidad],
  migrations: [CreaUsuariosYSolicitudes1758100000000],
  // El esquema se crea solo por migraciones: nunca sincronización automática,
  // ni siquiera en desarrollo, para que lo que corre en local sea lo mismo que
  // correría en producción.
  synchronize: false,
  migrationsRun: false,
  logging: process.env.DB_LOGGING === 'true',
};

/** DataSource que usa el CLI de TypeORM para correr y revertir migraciones. */
export default new DataSource(opcionesDeBase);
