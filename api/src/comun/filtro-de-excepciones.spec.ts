import { type ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import {
  ErrorDeConflicto,
  ErrorDePermiso,
  ErrorDeValidacion,
} from '../dominio/index.js';
import { ErrorNoEncontrado } from './errores-http.js';
import { FiltroDeExcepciones } from './filtro-de-excepciones.js';

function armar() {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ method: 'POST', originalUrl: '/api/solicitudes' }),
    }),
  } as unknown as ArgumentsHost;

  return { filtro: new FiltroDeExcepciones(), host, status, json };
}

describe('FiltroDeExcepciones', () => {
  it('traduce un error de validación del dominio a 422 con detalle por campo', () => {
    const { filtro, host, status, json } = armar();

    filtro.catch(
      new ErrorDeValidacion('La solicitud contiene campos inválidos', [
        { campo: 'monto', mensaje: 'El monto debe estar entre S/ 1,000 y S/ 10,000' },
      ]),
      host,
    );

    expect(status).toHaveBeenCalledWith(422);
    expect(json).toHaveBeenCalledWith({
      statusCode: 422,
      error: 'ValidacionFallida',
      mensaje: 'La solicitud contiene campos inválidos',
      detalles: [
        { campo: 'monto', mensaje: 'El monto debe estar entre S/ 1,000 y S/ 10,000' },
      ],
    });
  });

  it('traduce un conflicto a 409 conservando el código', () => {
    const { filtro, host, json } = armar();

    filtro.catch(
      new ErrorDeConflicto('Ya tenés una solicitud pendiente', 'SOLICITUD_ACTIVA_EXISTENTE'),
      host,
    );

    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      error: 'Conflicto',
      mensaje: 'Ya tenés una solicitud pendiente',
      codigo: 'SOLICITUD_ACTIVA_EXISTENTE',
    });
  });

  it('traduce la falta de permiso a 403', () => {
    const { filtro, host, status } = armar();

    filtro.catch(new ErrorDePermiso('Esta solicitud pertenece a otro estudiante'), host);

    expect(status).toHaveBeenCalledWith(403);
  });

  it('respeta el estado y los campos extra de una HttpException', () => {
    const { filtro, host, json } = armar();

    filtro.catch(new ErrorNoEncontrado('No existe', 'USUARIO_NO_ENCONTRADO'), host);

    expect(json).toHaveBeenCalledWith({
      statusCode: 404,
      error: 'NoEncontrado',
      mensaje: 'No existe',
      codigo: 'USUARIO_NO_ENCONTRADO',
    });
  });

  it('normaliza una HttpException de Nest que trae `message`', () => {
    const { filtro, host, json } = armar();

    filtro.catch(new HttpException('Sin autorización', HttpStatus.UNAUTHORIZED), host);

    expect(json).toHaveBeenCalledWith({
      statusCode: 401,
      error: 'NoAutenticado',
      mensaje: 'Sin autorización',
    });
  });

  it('convierte lo inesperado en un 500 con requestId y sin detalle interno', () => {
    const registro = vi.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { filtro, host, json } = armar();

    filtro.catch(new Error('relation "solicitudes" does not exist'), host);

    const cuerpo = json.mock.calls[0][0] as Record<string, unknown>;

    expect(cuerpo.statusCode).toBe(500);
    expect(cuerpo.error).toBe('ErrorInterno');
    expect(cuerpo.requestId).toMatch(/^[0-9a-f-]{36}$/);
    expect(JSON.stringify(cuerpo)).not.toContain('solicitudes');
    // El detalle real queda del lado del servidor, asociado al mismo id.
    expect(registro).toHaveBeenCalledOnce();
    expect(String(registro.mock.calls[0][0])).toContain(String(cuerpo.requestId));

    registro.mockRestore();
  });
});
