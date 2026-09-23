import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega la dirección al usuario y a la solicitud.
 *
 * En `solicitudes` es una copia, no una referencia al usuario: igual que
 * `tasa_anual`, la fila conserva el dato con el que se evaluó el pedido aunque
 * el estudiante se mude después.
 *
 * Las dos columnas admiten `NULL` a propósito. Las filas que ya existen no
 * tienen dirección, y la base no puede inventarla: un valor por defecto como
 * `''` pasaría por dato real. La obligatoriedad la exige el dominio al crear,
 * que es donde vive la regla; la lectura de filas viejas no revalida y la
 * interfaz muestra "—". El largo máximo lo fija `varchar(200)`.
 */
export class AgregaDireccion1790207239913 implements MigrationInterface {
  name = 'AgregaDireccion1790207239913';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "usuarios" ADD COLUMN "direccion" character varying(200)`,
    );
    await queryRunner.query(
      `ALTER TABLE "solicitudes" ADD COLUMN "direccion" character varying(200)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "solicitudes" DROP COLUMN "direccion"`);
    await queryRunner.query(`ALTER TABLE "usuarios" DROP COLUMN "direccion"`);
  }
}
