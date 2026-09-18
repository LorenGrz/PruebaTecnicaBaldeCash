export interface ConfiguracionDeBase {
  host: string;
  puerto: number;
  usuario: string;
  password: string;
  nombre: string;
}

export interface Configuracion {
  puerto: number;
  origenWeb: string;
  tasaAnual: number;
  base: ConfiguracionDeBase;
}

const TASA_ANUAL_POR_DEFECTO = 0.24;

/**
 * Lee la tasa anual del entorno. Es configuración del negocio, no una constante
 * del código: si mañana el financiamiento cambia de precio, cambia el `.env`.
 *
 * Se valida al arrancar y no en cada solicitud: es preferible que la aplicación
 * no levante a que empiece a calcular cuotas con una tasa absurda.
 */
export function leerTasaAnual(valor: string | undefined): number {
  if (valor === undefined || valor.trim() === '') return TASA_ANUAL_POR_DEFECTO;

  const tasa = Number(valor);

  if (!Number.isFinite(tasa)) {
    throw new Error(`TASA_ANUAL debe ser un número decimal, se recibió "${valor}"`);
  }
  if (tasa < 0 || tasa >= 1) {
    throw new Error(
      `TASA_ANUAL debe expresarse en decimal y estar entre 0 y 1 (24% = 0.24), se recibió "${valor}"`,
    );
  }

  return tasa;
}

function leerPuerto(valor: string | undefined): number {
  const puerto = Number(valor ?? 3001);
  if (!Number.isInteger(puerto) || puerto <= 0 || puerto > 65535) {
    throw new Error(`PORT debe ser un puerto válido, se recibió "${valor}"`);
  }
  return puerto;
}

export function leerConfiguracionDeBase(): ConfiguracionDeBase {
  return {
    host: process.env.DB_HOST ?? 'localhost',
    puerto: Number(process.env.DB_PORT ?? 5432),
    usuario: process.env.DB_USER ?? 'baldecash',
    password: process.env.DB_PASSWORD ?? 'baldecash',
    nombre: process.env.DB_NAME ?? 'baldecash',
  };
}

export const configuracion = (): Configuracion => ({
  puerto: leerPuerto(process.env.PORT),
  origenWeb: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  tasaAnual: leerTasaAnual(process.env.TASA_ANUAL),
  base: leerConfiguracionDeBase(),
});
