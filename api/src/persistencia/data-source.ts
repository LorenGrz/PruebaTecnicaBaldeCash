import { DataSource, type DataSourceOptions } from 'typeorm';
import { leerConfiguracionDeBase } from '../config/index.js';
import { SolicitudEntidad, UsuarioEntidad } from './entidades/index.js';

const base = leerConfiguracionDeBase();

export const opcionesDeBase: DataSourceOptions = {
  type: 'postgres',
  host: base.host,
  port: base.puerto,
  username: base.usuario,
  password: base.password,
  database: base.nombre,
  entities: [UsuarioEntidad, SolicitudEntidad],
  // Las migraciones se descubren solas: alcanza con dejar el archivo en la
  // carpeta. Se apunta a `dist` porque el CLI corre sobre el código compilado,
  // igual que la aplicación. Antes había que importarlas y listarlas a mano, y
  // olvidarse del segundo paso hacía que la migración nueva no existiera para
  // nadie.
  migrations: ['dist/persistencia/migraciones/*.js'],
  // El esquema se crea solo por migraciones: nunca sincronización automática,
  // ni siquiera en desarrollo, para que lo que corre en local sea lo mismo que
  // correría en producción.
  synchronize: false,
  migrationsRun: false,
  logging: process.env.DB_LOGGING === 'true',
};

/** DataSource que usa el CLI de TypeORM para correr y revertir migraciones. */
export default new DataSource(opcionesDeBase);
