import type { Repository } from 'typeorm';
import { ErrorDeConflicto, Solicitud, Usuario } from '../dominio/index.js';
import type { SolicitudEntidad } from '../persistencia/index.js';
import { SolicitudesRepositorio } from './solicitudes.repositorio.js';

const estudiante = Usuario.crear({
  id: 'est-1',
  nombre: 'Clara Fernández',
  dni: '45871203',
  email: 'clara@ejemplo.pe',
  telefono: '987654321',
  rol: 'estudiante',
});

const solicitud = () =>
  Solicitud.crear({ usuario: estudiante, monto: 3000, plazoMeses: 12, tasaAnual: 0.24 });

/** Error tal como lo devuelve el driver de PostgreSQL. */
function violacionDeUnicidad(constraint: string) {
  return Object.assign(new Error('duplicate key value violates unique constraint'), {
    code: '23505',
    constraint,
  });
}

function armar(alGuardar: () => Promise<unknown>) {
  const filas = {
    create: (datos: unknown) => datos,
    save: alGuardar,
  };

  return new SolicitudesRepositorio(filas as unknown as Repository<SolicitudEntidad>);
}

describe('SolicitudesRepositorio · carrera de solicitudes activas', () => {
  it('traduce la violación del índice al mismo 409 que la verificación previa', async () => {
    const repositorio = armar(() =>
      Promise.reject(violacionDeUnicidad('idx_solicitudes_activa_por_usuario')),
    );

    /*
     * Es el caso que la verificación del servicio no puede cubrir: dos
     * peticiones simultáneas que la pasan las dos y chocan al escribir. El
     * cliente tiene que ver un 409, no un 500.
     */
    await expect(repositorio.guardar(solicitud())).rejects.toBeInstanceOf(ErrorDeConflicto);

    await expect(repositorio.guardar(solicitud())).rejects.toMatchObject({
      codigo: 'SOLICITUD_ACTIVA_EXISTENTE',
    });
  });

  it('no se queda con la violación de otro índice', async () => {
    const original = violacionDeUnicidad('idx_usuarios_dni');
    const repositorio = armar(() => Promise.reject(original));

    // Solo se traduce el índice de la solicitud activa: cualquier otro choque
    // de unicidad es un problema distinto y tiene que seguir subiendo.
    await expect(repositorio.guardar(solicitud())).rejects.toBe(original);
  });

  it('deja pasar los errores que no son de unicidad', async () => {
    const caida = new Error('se cayó la conexión');
    const repositorio = armar(() => Promise.reject(caida));

    await expect(repositorio.guardar(solicitud())).rejects.toBe(caida);
  });
});
