import type { ConfigService } from '@nestjs/config';
import {
  ErrorDeConflicto,
  ErrorDePermiso,
  ErrorDeValidacion,
  Solicitud,
  Usuario,
  type EstadoSolicitud,
} from '../dominio/index.js';
import type { UsuariosService } from '../usuarios/usuarios.service.js';
import type {
  PaginaDeSolicitudes,
  SolicitudConEstudiante,
  SolicitudesRepositorio,
} from './solicitudes.repositorio.js';
import { LIMITE_MAXIMO, SolicitudesService } from './solicitudes.service.js';

const TASA = 0.24;

const estudiante = Usuario.desdePersistencia({
  id: '11111111-1111-4111-8111-111111111111',
  nombre: 'Clara Fernández',
  dni: '45871203',
  email: 'clara@ejemplo.pe',
  telefono: '987654321',
  rol: 'estudiante',
});

const otroEstudiante = Usuario.desdePersistencia({
  id: '22222222-2222-4222-8222-222222222222',
  nombre: 'Rodrigo Salazar',
  dni: '61203948',
  email: 'rodrigo@ejemplo.pe',
  telefono: '944556677',
  rol: 'estudiante',
});

const admin = Usuario.desdePersistencia({
  id: '33333333-3333-4333-8333-333333333333',
  nombre: 'Emilio Gonzales',
  dni: '10293847',
  email: 'emilio@baldecash.com',
  telefono: '999888777',
  rol: 'admin',
});

function solicitudDe(estado: EstadoSolicitud, dueno = estudiante): Solicitud {
  return Solicitud.desdePersistencia({
    id: '44444444-4444-4444-8444-444444444444',
    usuarioId: dueno.id ?? '',
    monto: 3000,
    plazoMeses: 12,
    tasaAnual: TASA,
    cuotaMensual: 283.68,
    estado,
  });
}

const datosDelFormulario = {
  nombre: estudiante.nombre,
  dni: estudiante.dni,
  email: estudiante.email,
  telefono: estudiante.telefono,
  monto: 3000,
  plazoMeses: 12,
};

interface RepositorioFalso {
  guardar: ReturnType<typeof vi.fn>;
  buscarPorId: ReturnType<typeof vi.fn>;
  buscarUltimaDeUsuario: ReturnType<typeof vi.fn>;
  buscarActivaDeUsuario: ReturnType<typeof vi.fn>;
  listar: ReturnType<typeof vi.fn>;
}

function armar(parcial: Partial<RepositorioFalso> = {}) {
  const repositorio: RepositorioFalso = {
    guardar: vi.fn((solicitud: Solicitud) => Promise.resolve(solicitud)),
    buscarPorId: vi.fn(() => Promise.resolve(null)),
    buscarUltimaDeUsuario: vi.fn(() => Promise.resolve(null)),
    buscarActivaDeUsuario: vi.fn(() => Promise.resolve(null)),
    listar: vi.fn(() =>
      Promise.resolve({ filas: [], total: 0 } satisfies PaginaDeSolicitudes),
    ),
    ...parcial,
  };

  const usuarios = {
    actualizarContacto: vi.fn((usuario: Usuario) => Promise.resolve(usuario)),
  };

  const config = { getOrThrow: vi.fn(() => TASA) };

  const servicio = new SolicitudesService(
    repositorio as unknown as SolicitudesRepositorio,
    usuarios as unknown as UsuariosService,
    config as unknown as ConfigService,
  );

  return { servicio, repositorio, usuarios };
}

describe('SolicitudesService · una sola solicitud activa', () => {
  it('rechaza la segunda solicitud si ya hay una pendiente', async () => {
    const { servicio, repositorio } = armar({
      buscarActivaDeUsuario: vi.fn(() =>
        Promise.resolve(solicitudDe('pendiente')),
      ),
    });

    await expect(
      servicio.crear(estudiante, datosDelFormulario),
    ).rejects.toMatchObject({ codigo: 'SOLICITUD_ACTIVA_EXISTENTE' });

    await expect(
      servicio.crear(estudiante, datosDelFormulario),
    ).rejects.toBeInstanceOf(ErrorDeConflicto);

    expect(repositorio.guardar).not.toHaveBeenCalled();
  });

  it('rechaza la segunda solicitud si ya hay una aprobada', async () => {
    const { servicio } = armar({
      buscarActivaDeUsuario: vi.fn(() =>
        Promise.resolve(solicitudDe('aprobada')),
      ),
    });

    await expect(
      servicio.crear(estudiante, datosDelFormulario),
    ).rejects.toMatchObject({ codigo: 'SOLICITUD_ACTIVA_EXISTENTE' });
  });

  it('deja pedir de nuevo cuando la anterior fue rechazada', async () => {
    const { servicio, repositorio } = armar();

    const { solicitud } = await servicio.crear(estudiante, datosDelFormulario);

    expect(solicitud.estado).toBe('pendiente');
    expect(solicitud.cuotaMensual).toBe(283.68);
    expect(repositorio.guardar).toHaveBeenCalledTimes(1);
  });

  it('valida el monto antes de mirar el cupo: un monto inválido es 422, no 409', async () => {
    const { servicio, repositorio } = armar({
      buscarActivaDeUsuario: vi.fn(() =>
        Promise.resolve(solicitudDe('pendiente')),
      ),
    });

    await expect(
      servicio.crear(estudiante, { ...datosDelFormulario, monto: 999 }),
    ).rejects.toBeInstanceOf(ErrorDeValidacion);

    expect(repositorio.buscarActivaDeUsuario).not.toHaveBeenCalled();
  });

  it('no acepta un DNI distinto al de la sesión', async () => {
    const { servicio } = armar();

    await expect(
      servicio.crear(estudiante, { ...datosDelFormulario, dni: '00000000' }),
    ).rejects.toMatchObject({ detalles: [{ campo: 'dni' }] });
  });
});

describe('SolicitudesService · detalle', () => {
  it('devuelve 403 cuando la solicitud es de otro estudiante', async () => {
    const { servicio } = armar({
      buscarPorId: vi.fn(() =>
        Promise.resolve({
          solicitud: solicitudDe('pendiente'),
          estudiante,
        } satisfies SolicitudConEstudiante),
      ),
    });

    await expect(
      servicio.buscarPorId('44444444-4444-4444-8444-444444444444', otroEstudiante),
    ).rejects.toBeInstanceOf(ErrorDePermiso);
  });

  it('deja ver la propia y también deja ver cualquiera al administrador', async () => {
    const { servicio } = armar({
      buscarPorId: vi.fn(() =>
        Promise.resolve({
          solicitud: solicitudDe('pendiente'),
          estudiante,
        } satisfies SolicitudConEstudiante),
      ),
    });

    const id = '44444444-4444-4444-8444-444444444444';

    await expect(servicio.buscarPorId(id, estudiante)).resolves.toBeDefined();
    await expect(servicio.buscarPorId(id, admin)).resolves.toBeDefined();
  });

  it('devuelve 404 cuando no existe', async () => {
    const { servicio } = armar();

    await expect(
      servicio.buscarPorId('44444444-4444-4444-8444-444444444444', admin),
    ).rejects.toMatchObject({ response: { codigo: 'SOLICITUD_NO_ENCONTRADA' } });
  });
});

describe('SolicitudesService · cambio de estado', () => {
  function conPendiente() {
    return armar({
      buscarPorId: vi.fn(() =>
        Promise.resolve({
          solicitud: solicitudDe('pendiente'),
          estudiante,
        } satisfies SolicitudConEstudiante),
      ),
    });
  }

  const id = '44444444-4444-4444-8444-444444444444';

  it('un estudiante no puede aprobar ni siquiera su propia solicitud', async () => {
    const { servicio, repositorio } = conPendiente();

    await expect(
      servicio.cambiarEstado(id, { estado: 'aprobada' }, estudiante),
    ).rejects.toBeInstanceOf(ErrorDePermiso);

    expect(repositorio.guardar).not.toHaveBeenCalled();
  });

  it('el administrador aprueba y el estado queda aprobada', async () => {
    const { servicio } = conPendiente();

    const { solicitud } = await servicio.cambiarEstado(
      id,
      { estado: 'aprobada' },
      admin,
    );

    expect(solicitud.estado).toBe('aprobada');
  });

  it('no se puede resolver dos veces la misma solicitud', async () => {
    const { servicio } = armar({
      buscarPorId: vi.fn(() =>
        Promise.resolve({
          solicitud: solicitudDe('rechazada'),
          estudiante,
        } satisfies SolicitudConEstudiante),
      ),
    });

    await expect(
      servicio.cambiarEstado(id, { estado: 'aprobada' }, admin),
    ).rejects.toMatchObject({ codigo: 'TRANSICION_INVALIDA' });
  });

  it('un estado desconocido es 422', async () => {
    const { servicio } = conPendiente();

    await expect(
      servicio.cambiarEstado(id, { estado: 'archivada' }, admin),
    ).rejects.toBeInstanceOf(ErrorDeValidacion);
  });
});

describe('SolicitudesService · listado', () => {
  it('solo lo ve el administrador', async () => {
    const { servicio } = armar();

    await expect(servicio.listar(estudiante, {})).rejects.toBeInstanceOf(
      ErrorDePermiso,
    );
  });

  it('pagina desde 1 con 10 por página cuando no se pide nada', async () => {
    const { servicio, repositorio } = armar();

    const listado = await servicio.listar(admin, {});

    expect(repositorio.listar).toHaveBeenCalledWith({
      estado: undefined,
      page: 1,
      limit: 10,
    });
    expect(listado).toMatchObject({ page: 1, limit: 10, total: 0 });
  });

  it('respeta el filtro y la página pedidos', async () => {
    const { servicio, repositorio } = armar({
      listar: vi.fn(() =>
        Promise.resolve({
          filas: [{ solicitud: solicitudDe('pendiente'), estudiante }],
          total: 3,
        } satisfies PaginaDeSolicitudes),
      ),
    });

    const listado = await servicio.listar(admin, {
      estado: 'pendiente',
      page: 2,
      limit: 2,
    });

    expect(repositorio.listar).toHaveBeenCalledWith({
      estado: 'pendiente',
      page: 2,
      limit: 2,
    });
    expect(listado.total).toBe(3);
    expect(listado.filas).toHaveLength(1);
  });

  it('recorta un límite desmedido al tope del servidor', async () => {
    const { servicio, repositorio } = armar();

    const listado = await servicio.listar(admin, { limit: 100000 });

    expect(repositorio.listar).toHaveBeenCalledWith({
      estado: undefined,
      page: 1,
      limit: LIMITE_MAXIMO,
    });
    expect(listado.limit).toBe(LIMITE_MAXIMO);
  });
});

describe('SolicitudesService · /mia', () => {
  it('devuelve null cuando el estudiante no pidió nada', async () => {
    const { servicio } = armar();

    await expect(servicio.buscarLaMia(estudiante)).resolves.toBeNull();
  });

  it('devuelve la más reciente, aunque la anterior haya sido rechazada', async () => {
    const { servicio } = armar({
      buscarUltimaDeUsuario: vi.fn(() =>
        Promise.resolve(solicitudDe('pendiente')),
      ),
    });

    const fila = await servicio.buscarLaMia(estudiante);

    expect(fila?.solicitud.estado).toBe('pendiente');
  });
});
