import type { INestApplication } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { configurarAplicacion } from './../src/comun/index.js';
import { AppModule } from './../src/app.module.js';

describe('Salud (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    configurarAplicacion(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/salud responde ok sin identidad', () => {
    return request(app.getHttpServer())
      .get('/api/salud')
      .expect(200)
      .expect({ estado: 'ok' });
  });
});
