import { MigrationInterface, QueryRunner } from 'typeorm';

export class nfts1649536994373 implements MigrationInterface {
  name = 'nfts1649536994373';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "nfts" character varying array NOT NULL DEFAULT '{}'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "nfts"`);
  }
}
