import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema inicial: usuarios y sus solicitudes de financiamiento.
 *
 * Decisiones que quedan fijadas acá:
 * - `numeric` para los importes, nunca `float`: en punto flotante binario
 *   0.1 + 0.2 !== 0.3, y eso en dinero es un error que aparece tarde.
 * - `tasa_anual` y `cuota_mensual` se guardan en la fila. La tasa es
 *   configurable por entorno; una solicitud aprobada tiene que seguir
 *   mostrando la cuota con la que se aprobó aunque la tasa cambie.
 * - Índices en `estado` (filtro del listado) y `usuario_id` (detalle y regla
 *   de una sola solicitud activa por estudiante).
 */
export class CreaUsuariosYSolicitudes1758100000000 implements MigrationInterface {
  name = 'CreaUsuariosYSolicitudes1758100000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "usuarios" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "nombre" character varying(120) NOT NULL,
        "dni" character(8) NOT NULL,
        "email" character varying(160) NOT NULL,
        "telefono" character(9) NOT NULL,
        "rol" character varying(20) NOT NULL DEFAULT 'estudiante',
        "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_usuarios" PRIMARY KEY ("id"),
        CONSTRAINT "ck_usuarios_rol" CHECK ("rol" IN ('estudiante', 'admin'))
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_usuarios_dni" ON "usuarios" ("dni")`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "idx_usuarios_email" ON "usuarios" ("email")`,
    );

    await queryRunner.query(`
      CREATE TABLE "solicitudes" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "usuario_id" uuid NOT NULL,
        "monto" numeric(10,2) NOT NULL,
        "plazo_meses" smallint NOT NULL,
        "tasa_anual" numeric(5,4) NOT NULL,
        "cuota_mensual" numeric(10,2) NOT NULL,
        "estado" character varying(20) NOT NULL DEFAULT 'pendiente',
        "creado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "actualizado_en" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        CONSTRAINT "pk_solicitudes" PRIMARY KEY ("id"),
        CONSTRAINT "fk_solicitudes_usuario" FOREIGN KEY ("usuario_id")
          REFERENCES "usuarios" ("id") ON DELETE CASCADE,
        CONSTRAINT "ck_solicitudes_estado"
          CHECK ("estado" IN ('pendiente', 'aprobada', 'rechazada')),
        CONSTRAINT "ck_solicitudes_plazo" CHECK ("plazo_meses" IN (6, 12, 18, 24)),
        CONSTRAINT "ck_solicitudes_monto"
          CHECK ("monto" >= 1000 AND "monto" <= 10000)
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_solicitudes_estado" ON "solicitudes" ("estado")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_solicitudes_usuario" ON "solicitudes" ("usuario_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "solicitudes"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
  }
}
