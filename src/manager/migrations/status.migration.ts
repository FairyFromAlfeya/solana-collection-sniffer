import { MigrationInterface, QueryRunner } from 'typeorm';

export class status1649894490892 implements MigrationInterface {
  name = 'status1649894490892';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "floor_nft" character varying`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."collections_status_enum" AS ENUM('COLLECTION_STATUS_UNSPECIFIED', 'COLLECTION_STATUS_CREATED', 'COLLECTION_STATUS_LOADING_COLLECTION', 'COLLECTION_STATUS_LOADING_NFTS', 'COLLECTION_STATUS_READY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ADD "status" "public"."collections_status_enum" NOT NULL DEFAULT 'COLLECTION_STATUS_CREATED'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "collections" DROP COLUMN "status"`);
    await queryRunner.query(`DROP TYPE "public"."collections_status_enum"`);
    await queryRunner.query(
      `ALTER TABLE "collections" DROP COLUMN "floor_nft"`,
    );
  }
}
