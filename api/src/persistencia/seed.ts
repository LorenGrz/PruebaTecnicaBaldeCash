import { Solicitud, Usuario } from '../dominio/index.js';
import { leerTasaAnual } from '../config/index.js';
import fuenteDeDatos from './data-source.js';
import { SolicitudEntidad, UsuarioEntidad } from './entidades/index.js';
import { aSolicitudDeEntidad, aUsuarioDeEntidad } from './mapeadores/index.js';

/**
 * Datos de ejemplo para poder probar el listado, el filtro y la paginación sin
 * cargar nada a mano. Se construyen con las clases de dominio, así que el seed
 * respeta las mismas reglas que la API: si un dato no pasara la validación,
 * este script falla en vez de ensuciar la base.
 */

const TASA_ANUAL = leerTasaAnual(process.env.TASA_ANUAL);

const usuarios = [
  {
    nombre: 'Emilio Gonzales',
    dni: '10293847',
    email: 'emilio@baldecash.com',
    telefono: '999888777',
    rol: 'admin' as const,
  },
  {
    nombre: 'Loren Graizzaro',
    dni: '44554475',
    email: 'loren@baldecash.com',
    telefono: '955667788',
    rol: 'admin' as const,
  },
  {
    nombre: 'Clara Fernández',
    dni: '45871203',
    email: 'clara.fernandez@ejemplo.pe',
    telefono: '987654321',
    rol: 'estudiante' as const,
  },
  {
    nombre: 'Ethel Castillo',
    dni: '78129034',
    email: 'ethel.castillo@ejemplo.pe',
    telefono: '911222333',
    rol: 'estudiante' as const,
  },
  {
    nombre: 'Rodrigo Salazar',
    dni: '61203948',
    email: 'rodrigo.salazar@ejemplo.pe',
    telefono: '944556677',
    rol: 'estudiante' as const,
  },
  {
    nombre: 'Milagros Quispe',
    dni: '39485712',
    email: 'milagros.quispe@ejemplo.pe',
    telefono: '933221144',
    rol: 'estudiante' as const,
  },
];

const solicitudes = [
  {
    dni: '45871203',
    monto: 3000,
    plazoMeses: 12,
    estado: 'pendiente' as const,
  },
  { dni: '78129034', monto: 5500, plazoMeses: 18, estado: 'aprobada' as const },
  { dni: '61203948', monto: 1200, plazoMeses: 6, estado: 'rechazada' as const },
  {
    dni: '39485712',
    monto: 10000,
    plazoMeses: 24,
    estado: 'pendiente' as const,
  },
  {
    dni: '61203948',
    monto: 2500,
    plazoMeses: 12,
    estado: 'pendiente' as const,
  },
];

async function sembrar(): Promise<void> {
  await fuenteDeDatos.initialize();

  try {
    const repoUsuarios = fuenteDeDatos.getRepository(UsuarioEntidad);
    const repoSolicitudes = fuenteDeDatos.getRepository(SolicitudEntidad);

    // Idempotente: se puede correr las veces que haga falta sin duplicar.
    await repoSolicitudes.deleteAll();
    await repoUsuarios.deleteAll();

    const guardados = new Map<string, string>();

    for (const datos of usuarios) {
      const usuario = Usuario.crear(datos);
      const fila = await repoUsuarios.save(
        repoUsuarios.create(aUsuarioDeEntidad(usuario)),
      );
      guardados.set(usuario.dni, fila.id);
    }

    const admin = Usuario.desdePersistencia({
      ...usuarios[0],
      id: guardados.get(usuarios[0].dni)!,
    });

    for (const datos of solicitudes) {
      const dueno = usuarios.find((u) => u.dni === datos.dni)!;
      const estudiante = Usuario.desdePersistencia({
        ...dueno,
        id: guardados.get(datos.dni)!,
      });

      const solicitud = Solicitud.crear({
        usuario: estudiante,
        monto: datos.monto,
        plazoMeses: datos.plazoMeses,
        tasaAnual: TASA_ANUAL,
      });

      // Los estados finales se aplican con las reglas del dominio, no
      // escribiendo la columna a mano.
      if (datos.estado === 'aprobada') solicitud.aprobar(admin);
      if (datos.estado === 'rechazada') solicitud.rechazar(admin);

      await repoSolicitudes.save(
        repoSolicitudes.create(aSolicitudDeEntidad(solicitud)),
      );
    }

    console.log(
      `Seed listo: ${usuarios.length} usuarios y ${solicitudes.length} solicitudes con tasa ${(TASA_ANUAL * 100).toFixed(2)}%`,
    );
  } finally {
    await fuenteDeDatos.destroy();
  }
}

await sembrar();
