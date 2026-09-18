import { ErrorDeConflicto, Usuario } from '../dominio/index.js';
import type { UsuariosRepositorio } from './usuarios.repositorio.js';
import { UsuariosService } from './usuarios.service.js';

const datos = {
  nombre: 'Valeria Ríos',
  dni: '70001122',
  email: 'valeria.rios@ejemplo.pe',
  telefono: '955443322',
};

const existente = Usuario.desdePersistencia({
  id: '11111111-1111-4111-8111-111111111111',
  ...datos,
  rol: 'estudiante',
});

function armar(parcial: Record<string, unknown> = {}) {
  const repositorio = {
    buscarPorId: vi.fn(() => Promise.resolve(null)),
    buscarPorDni: vi.fn(() => Promise.resolve(null)),
    buscarPorEmail: vi.fn(() => Promise.resolve(null)),
    guardar: vi.fn((usuario: Usuario) => Promise.resolve(usuario)),
    ...parcial,
  };

  return {
    servicio: new UsuariosService(repositorio as unknown as UsuariosRepositorio),
    repositorio,
  };
}

describe('UsuariosService · alta', () => {
  it('crea al estudiante con los datos normalizados', async () => {
    const { servicio } = armar();

    const usuario = await servicio.registrar({
      ...datos,
      email: '  VALERIA.RIOS@ejemplo.pe ',
    });

    expect(usuario.email).toBe('valeria.rios@ejemplo.pe');
    expect(usuario.rol).toBe('estudiante');
  });

  it('nunca crea un administrador desde el endpoint público', async () => {
    const { servicio } = armar();

    // El cuerpo podría traer un rol de más; el DTO lo descarta y el servicio
    // lo fija igual.
    const cuerpoConRol = { ...datos, rol: 'admin' };
    const usuario = await servicio.registrar(cuerpoConRol);

    expect(usuario.rol).toBe('estudiante');
  });

  it('responde DNI_DUPLICADO si el documento ya existe', async () => {
    const { servicio } = armar({
      buscarPorDni: vi.fn(() => Promise.resolve(existente)),
    });

    await expect(servicio.registrar(datos)).rejects.toMatchObject({
      codigo: 'DNI_DUPLICADO',
    });
  });

  it('responde EMAIL_DUPLICADO si el correo ya existe', async () => {
    const { servicio } = armar({
      buscarPorEmail: vi.fn(() => Promise.resolve(existente)),
    });

    await expect(servicio.registrar(datos)).rejects.toBeInstanceOf(ErrorDeConflicto);
  });
});

describe('UsuariosService · datos de contacto', () => {
  it('no escribe en la base si el formulario no cambió nada', async () => {
    const { servicio, repositorio } = armar();

    await servicio.actualizarContacto(existente, {
      nombre: datos.nombre,
      email: datos.email,
      telefono: datos.telefono,
    });

    expect(repositorio.guardar).not.toHaveBeenCalled();
  });

  it('guarda el teléfono nuevo', async () => {
    const { servicio, repositorio } = armar();

    const actualizado = await servicio.actualizarContacto(existente, {
      nombre: datos.nombre,
      email: datos.email,
      telefono: '911111111',
    });

    expect(actualizado.telefono).toBe('911111111');
    expect(repositorio.guardar).toHaveBeenCalledOnce();
  });

  it('no deja quedarse con el correo de otro usuario', async () => {
    const otro = Usuario.desdePersistencia({
      id: '22222222-2222-4222-8222-222222222222',
      ...datos,
      email: 'ocupado@ejemplo.pe',
      rol: 'estudiante',
    });

    const { servicio } = armar({
      buscarPorEmail: vi.fn(() => Promise.resolve(otro)),
    });

    await expect(
      servicio.actualizarContacto(existente, {
        nombre: datos.nombre,
        email: 'ocupado@ejemplo.pe',
        telefono: datos.telefono,
      }),
    ).rejects.toMatchObject({ codigo: 'EMAIL_DUPLICADO' });
  });
});
