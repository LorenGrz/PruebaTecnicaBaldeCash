import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from './../src/app.module.js';
import { configurarAplicacion } from './../src/comun/index.js';

/**
 * Recorre los flujos completos contra la base real. Crea sus propios usuarios
 * con un DNI irrepetible y los borra al final: no toca ni depende de las filas
 * del seed, salvo para encontrar un administrador.
 */

const CABECERA = 'x-usuario-id';

interface Sesion {
  id: string;
  dni: string;
}

function dniDePrueba(): string {
  return `88${Math.floor(100000 + Math.random() * 899999)}`;
}

describe('Solicitudes (e2e)', () => {
  let app: INestApplication;
  let baseDeDatos: DataSource;
  let estudiante: Sesion;
  let otroEstudiante: Sesion;
  let admin: Sesion;
  let solicitudId: string;

  async function altaDeEstudiante(nombre: string): Promise<Sesion> {
    const dni = dniDePrueba();

    const respuesta = await request(app.getHttpServer())
      .post('/api/usuarios')
      .send({
        nombre,
        dni,
        email: `${dni}@prueba.test`,
        telefono: '955443322',
      })
      .expect(201);

    return { id: respuesta.body.usuario.id, dni };
  }

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarAplicacion(app);
    await app.init();

    baseDeDatos = app.get(DataSource);

    const administradores: { id: string; dni: string }[] = await baseDeDatos.query(
      `SELECT id, dni FROM usuarios WHERE rol = 'admin' LIMIT 1`,
    );
    if (administradores.length === 0) {
      throw new Error('No hay administrador en la base: corré `pnpm seed`');
    }
    admin = administradores[0];

    estudiante = await altaDeEstudiante('Estudiante De Prueba');
    otroEstudiante = await altaDeEstudiante('Otro De Prueba');
  });

  afterAll(async () => {
    if (baseDeDatos?.isInitialized) {
      await baseDeDatos.query(
        `DELETE FROM solicitudes WHERE usuario_id IN (SELECT id FROM usuarios WHERE dni LIKE '88%')`,
      );
      await baseDeDatos.query(`DELETE FROM usuarios WHERE dni LIKE '88%'`);
    }
    await app.close();
  });

  describe('identidad', () => {
    it('sin cabecera responde 401', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/solicitudes/mias')
        .expect(401);

      expect(body.codigo).toBe('SIN_IDENTIDAD');
    });

    it('ingresar con un DNI inexistente responde 404 con código', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/auth/ingresar')
        .send({ dni: '00000001' })
        .expect(404);

      expect(body.codigo).toBe('USUARIO_NO_ENCONTRADO');
    });

    it('ingresar con un DNI existente devuelve el usuario y su rol', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/auth/ingresar')
        .send({ dni: estudiante.dni })
        .expect(200);

      expect(body.usuario).toMatchObject({ id: estudiante.id, rol: 'estudiante' });
    });

    it('repetir el alta con el mismo DNI responde 409', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/usuarios')
        .send({
          nombre: 'Clon De Prueba',
          dni: estudiante.dni,
          email: `clon-${estudiante.dni}@prueba.test`,
          telefono: '955443322',
        })
        .expect(409);

      expect(body.codigo).toBe('DNI_DUPLICADO');
    });
  });

  describe('alta de solicitud', () => {
    it('un monto de 3000 a 12 meses paga una cuota de 283.68', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/solicitudes')
        .set(CABECERA, estudiante.id)
        .send({
          nombre: 'Estudiante De Prueba',
          dni: estudiante.dni,
          email: `${estudiante.dni}@prueba.test`,
          telefono: '955443322',
          monto: 3000,
          plazoMeses: 12,
        })
        .expect(201);

      expect(body.solicitud.cuotaMensual).toBe(283.68);
      expect(body.solicitud.estado).toBe('pendiente');
      expect(body.solicitud.estudiante.dni).toBe(estudiante.dni);

      solicitudId = body.solicitud.id;
    });

    it('un monto fuera de rango responde 422 con el campo señalado', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/solicitudes')
        .set(CABECERA, estudiante.id)
        .send({
          nombre: 'Estudiante De Prueba',
          dni: estudiante.dni,
          email: `${estudiante.dni}@prueba.test`,
          telefono: '955443322',
          monto: 999,
          plazoMeses: 12,
        })
        .expect(422);

      expect(body).toMatchObject({
        statusCode: 422,
        error: 'ValidacionFallida',
      });
      expect(body.detalles[0].campo).toBe('monto');
    });

    it('un teléfono mal formado lo frena el DTO, también con 422', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/solicitudes')
        .set(CABECERA, estudiante.id)
        .send({
          nombre: 'Estudiante De Prueba',
          dni: estudiante.dni,
          email: `${estudiante.dni}@prueba.test`,
          telefono: '123',
          monto: 3000,
          plazoMeses: 12,
        })
        .expect(422);

      expect(body.detalles).toContainEqual({
        campo: 'telefono',
        mensaje: 'El teléfono debe tener 9 dígitos y empezar en 9',
      });
    });

    it('reenviar teniendo una pendiente responde 409', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/api/solicitudes')
        .set(CABECERA, estudiante.id)
        .send({
          nombre: 'Estudiante De Prueba',
          dni: estudiante.dni,
          email: `${estudiante.dni}@prueba.test`,
          telefono: '955443322',
          monto: 4000,
          plazoMeses: 6,
        })
        .expect(409);

      expect(body.codigo).toBe('SOLICITUD_ACTIVA_EXISTENTE');
    });
  });

  describe('lectura', () => {
    it('/mias devuelve el historial del estudiante', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/solicitudes/mias')
        .set(CABECERA, estudiante.id)
        .expect(200);

      expect(body.total).toBe(body.data.length);
      expect(body.data.map((fila: { id: string }) => fila.id)).toContain(
        solicitudId,
      );
    });

    it('/mias devuelve una lista vacía cuando el estudiante no pidió nada', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/solicitudes/mias')
        .set(CABECERA, otroEstudiante.id)
        .expect(200);

      expect(body).toEqual({ data: [], total: 0 });
    });

    it('/mias solo trae las propias: nunca las de otro estudiante', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/solicitudes/mias')
        .set(CABECERA, estudiante.id)
        .expect(200);

      const ajenas = body.data.filter(
        (fila: { usuarioId: string }) => fila.usuarioId !== estudiante.id,
      );
      expect(ajenas).toEqual([]);
    });

    it('el dueño y el administrador ven el detalle', async () => {
      await request(app.getHttpServer())
        .get(`/api/solicitudes/${solicitudId}`)
        .set(CABECERA, estudiante.id)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/solicitudes/${solicitudId}`)
        .set(CABECERA, admin.id)
        .expect(200);
    });

    it('otro estudiante recibe 403', async () => {
      const { body } = await request(app.getHttpServer())
        .get(`/api/solicitudes/${solicitudId}`)
        .set(CABECERA, otroEstudiante.id)
        .expect(403);

      expect(body.error).toBe('SinPermiso');
    });

    it('un id inexistente responde 404 y uno mal formado también', async () => {
      await request(app.getHttpServer())
        .get('/api/solicitudes/11111111-1111-4111-8111-111111111111')
        .set(CABECERA, admin.id)
        .expect(404);

      await request(app.getHttpServer())
        .get('/api/solicitudes/no-es-un-uuid')
        .set(CABECERA, admin.id)
        .expect(404);
    });
  });

  describe('listado del administrador', () => {
    it('pagina, filtra por estado y trae los datos del estudiante', async () => {
      const { body } = await request(app.getHttpServer())
        .get('/api/solicitudes?estado=pendiente&page=1&limit=2')
        .set(CABECERA, admin.id)
        .expect(200);

      expect(body.page).toBe(1);
      expect(body.limit).toBe(2);
      expect(body.data).toHaveLength(2);
      expect(body.total).toBeGreaterThanOrEqual(3);
      expect(body.data[0].estudiante.nombre).toBeTruthy();
      expect(body.data[0].estudiante.dni).toBeTruthy();
      expect(
        body.data.every(
          (fila: { estado: string }) => fila.estado === 'pendiente',
        ),
      ).toBe(true);
    });

    it('la segunda página trae otras solicitudes', async () => {
      const primera = await request(app.getHttpServer())
        .get('/api/solicitudes?page=1&limit=2')
        .set(CABECERA, admin.id)
        .expect(200);

      const segunda = await request(app.getHttpServer())
        .get('/api/solicitudes?page=2&limit=2')
        .set(CABECERA, admin.id)
        .expect(200);

      const idsPrimera = primera.body.data.map((fila: { id: string }) => fila.id);
      const idsSegunda = segunda.body.data.map((fila: { id: string }) => fila.id);

      expect(idsPrimera).not.toEqual(idsSegunda);
      expect(primera.body.total).toBe(segunda.body.total);
    });

    it('un estado inexistente responde 422', async () => {
      await request(app.getHttpServer())
        .get('/api/solicitudes?estado=archivada')
        .set(CABECERA, admin.id)
        .expect(422);
    });

    it('un estudiante no puede listar', async () => {
      await request(app.getHttpServer())
        .get('/api/solicitudes')
        .set(CABECERA, estudiante.id)
        .expect(403);
    });
  });

  describe('cambio de estado', () => {
    it('un estudiante no puede resolver su propia solicitud', async () => {
      await request(app.getHttpServer())
        .patch(`/api/solicitudes/${solicitudId}/estado`)
        .set(CABECERA, estudiante.id)
        .send({ estado: 'aprobada' })
        .expect(403);
    });

    it('el administrador la aprueba', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/api/solicitudes/${solicitudId}/estado`)
        .set(CABECERA, admin.id)
        .send({ estado: 'aprobada' })
        .expect(200);

      expect(body.solicitud.estado).toBe('aprobada');
      // Un UPDATE no puede perder la fecha de creación en la respuesta.
      expect(body.solicitud.creadoEn).not.toBeNull();
    });

    it('no se puede resolver dos veces', async () => {
      const { body } = await request(app.getHttpServer())
        .patch(`/api/solicitudes/${solicitudId}/estado`)
        .set(CABECERA, admin.id)
        .send({ estado: 'rechazada' })
        .expect(409);

      expect(body.codigo).toBe('TRANSICION_INVALIDA');
    });
  });

  describe('reenvío después de un rechazo', () => {
    it('una solicitud rechazada habilita pedir de nuevo', async () => {
      const cuerpo = {
        nombre: 'Otro De Prueba',
        dni: otroEstudiante.dni,
        email: `${otroEstudiante.dni}@prueba.test`,
        telefono: '955443322',
        monto: 2000,
        plazoMeses: 6,
      };

      const primera = await request(app.getHttpServer())
        .post('/api/solicitudes')
        .set(CABECERA, otroEstudiante.id)
        .send(cuerpo)
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/api/solicitudes/${primera.body.solicitud.id}/estado`)
        .set(CABECERA, admin.id)
        .send({ estado: 'rechazada' })
        .expect(200);

      const segunda = await request(app.getHttpServer())
        .post('/api/solicitudes')
        .set(CABECERA, otroEstudiante.id)
        .send({ ...cuerpo, monto: 2500 })
        .expect(201);

      expect(segunda.body.solicitud.estado).toBe('pendiente');

      // El resumen muestra el historial completo, con la más nueva primero:
      // la rechazada no desaparece, queda como antecedente.
      const mias = await request(app.getHttpServer())
        .get('/api/solicitudes/mias')
        .set(CABECERA, otroEstudiante.id)
        .expect(200);

      expect(mias.body.total).toBe(2);
      expect(mias.body.data[0].id).toBe(segunda.body.solicitud.id);
      expect(mias.body.data[0].monto).toBe(2500);
      expect(mias.body.data[1].estado).toBe('rechazada');
    });
  });
});
