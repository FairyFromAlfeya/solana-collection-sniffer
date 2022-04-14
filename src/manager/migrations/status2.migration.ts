import { MigrationInterface, QueryRunner } from 'typeorm';

export class status21649895807599 implements MigrationInterface {
  name = 'status21649895807599';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TYPE "public"."collections_status_enum" RENAME TO "collections_status_enum_old"`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."collections_status_enum" AS ENUM('COLLECTION_STATUS_UNSPECIFIED', 'COLLECTION_STATUS_CREATED', 'COLLECTION_STATUS_LOADING_COLLECTION', 'COLLECTION_STATUS_COLLECTION_LOADED', 'COLLECTION_STATUS_LOADING_NFTS', 'COLLECTION_STATUS_NFTS_LOADED', 'COLLECTION_STATUS_READY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ALTER COLUMN "status" TYPE "public"."collections_status_enum" USING "status"::"text"::"public"."collections_status_enum"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ALTER COLUMN "status" SET DEFAULT 'COLLECTION_STATUS_CREATED'`,
    );
    await queryRunner.query(`DROP TYPE "public"."collections_status_enum_old"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."collections_status_enum_old" AS ENUM('COLLECTION_STATUS_UNSPECIFIED', 'COLLECTION_STATUS_CREATED', 'COLLECTION_STATUS_LOADING_COLLECTION', 'COLLECTION_STATUS_LOADING_NFTS', 'COLLECTION_STATUS_READY')`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ALTER COLUMN "status" DROP DEFAULT`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ALTER COLUMN "status" TYPE "public"."collections_status_enum_old" USING "status"::"text"::"public"."collections_status_enum_old"`,
    );
    await queryRunner.query(
      `ALTER TABLE "collections" ALTER COLUMN "status" SET DEFAULT 'COLLECTION_STATUS_CREATED'`,
    );
    await queryRunner.query(`DROP TYPE "public"."collections_status_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."collections_status_enum_old" RENAME TO "collections_status_enum"`,
    );
  }
}
