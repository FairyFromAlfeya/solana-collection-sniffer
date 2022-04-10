import { MigrationInterface, QueryRunner } from 'typeorm';

export class floor1649618849450 implements MigrationInterface {
  name = 'floor1649618849450';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" ALTER COLUMN "floor" DROP NOT NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" ALTER COLUMN "floor" SET NOT NULL`,
    );
  }
}
