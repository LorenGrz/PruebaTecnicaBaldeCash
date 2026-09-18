import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { Usuario } from '../dominio/index.js';
import type { UsuariosRepositorio } from '../usuarios/usuarios.repositorio.js';
import { GuardDeIdentidad } from './guard-de-identidad.js';

const ID = '11111111-1111-4111-8111-111111111111';

const clara = Usuario.desdePersistencia({
  id: ID,
  nombre: 'Clara Fernández',
  dni: '45871203',
  email: 'clara@ejemplo.pe',
  telefono: '987654321',
  rol: 'estudiante',
});

function armar(opciones: {
  cabecera?: string;
  esPublico?: boolean;
  usuario?: Usuario | null;
}) {
  const peticion: { headers: Record<string, string>; usuarioActual?: Usuario } = {
    headers: opciones.cabecera ? { 'x-usuario-id': opciones.cabecera } : {},
  };

  const reflector = {
    getAllAndOverride: vi.fn(() => opciones.esPublico ?? false),
  } as unknown as Reflector;

  const buscarPorId = vi.fn(() => Promise.resolve(opciones.usuario ?? null));
  const repositorio = { buscarPorId } as unknown as UsuariosRepositorio;

  const contexto = {
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => peticion }),
  } as unknown as ExecutionContext;

  return {
    guard: new GuardDeIdentidad(reflector, repositorio),
    contexto,
    peticion,
    buscarPorId,
  };
}

describe('GuardDeIdentidad', () => {
  it('deja pasar una ruta pública sin tocar la base', async () => {
    const { guard, contexto, buscarPorId } = armar({ esPublico: true });

    await expect(guard.canActivate(contexto)).resolves.toBe(true);
    expect(buscarPorId).not.toHaveBeenCalled();
  });

  it('rechaza con 401 cuando falta la cabecera', async () => {
    const { guard, contexto } = armar({});

    await expect(guard.canActivate(contexto)).rejects.toMatchObject({
      response: { codigo: 'SIN_IDENTIDAD' },
    });
  });

  it('rechaza con 401 un id que no es uuid, sin consultar la base', async () => {
    const { guard, contexto, buscarPorId } = armar({ cabecera: 'soy-un-admin' });

    await expect(guard.canActivate(contexto)).rejects.toMatchObject({
      response: { codigo: 'SIN_IDENTIDAD' },
    });
    expect(buscarPorId).not.toHaveBeenCalled();
  });

  it('rechaza con 401 un uuid que no corresponde a ningún usuario', async () => {
    const { guard, contexto } = armar({ cabecera: ID, usuario: null });

    await expect(guard.canActivate(contexto)).rejects.toMatchObject({
      response: { codigo: 'IDENTIDAD_INVALIDA' },
    });
  });

  it('resuelve el usuario y lo deja en la petición', async () => {
    const { guard, contexto, peticion } = armar({ cabecera: ID, usuario: clara });

    await expect(guard.canActivate(contexto)).resolves.toBe(true);
    expect(peticion.usuarioActual?.dni).toBe('45871203');
  });
});
