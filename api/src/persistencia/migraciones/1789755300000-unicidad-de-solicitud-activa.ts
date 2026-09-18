import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cierra la regla de "una sola solicitud activa por estudiante" a nivel de base.
 *
 * Hasta acá la regla vivía solo en la aplicación: se consultaba si había una
 * activa y recién después se insertaba. Entre esas dos operaciones hay una
 * ventana, y dos peticiones simultáneas del mismo estudiante —un doble clic
 * alcanza— podían pasar las dos la verificación y crear dos solicitudes.
 *
 * Un índice único parcial lo vuelve imposible: PostgreSQL sostiene la
 * restricción sobre las filas `pendiente` y `aprobada`, y deja fuera a las
 * `rechazada`, que es justo lo que permite volver a pedir después de un
 * rechazo. La segunda inserción simultánea falla con 23505 y el repositorio
 * la traduce al mismo 409 que devuelve la verificación previa.
 */
export class UnicidadDeSolicitudActiva1789755300000 implements MigrationInterface {
  name = 'UnicidadDeSolicitudActiva1789755300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE UNIQUE INDEX "idx_solicitudes_activa_por_usuario"
        ON "solicitudes" ("usuario_id")
        WHERE "estado" IN ('pendiente', 'aprobada')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_solicitudes_activa_por_usuario"`);
  }
}
