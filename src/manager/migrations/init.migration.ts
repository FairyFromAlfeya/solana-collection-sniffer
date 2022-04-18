import { MigrationInterface, QueryRunner } from 'typeorm';

export class init1650247470127 implements MigrationInterface {
  name = 'init1650247470127';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."collections_status_enum" AS ENUM('COLLECTION_STATUS_UNSPECIFIED', 'COLLECTION_STATUS_CREATED', 'COLLECTION_STATUS_LOADING_COLLECTION', 'COLLECTION_STATUS_COLLECTION_LOADED', 'COLLECTION_STATUS_LOADING_NFTS', 'COLLECTION_STATUS_NFTS_LOADED', 'COLLECTION_STATUS_LOADING_RARITY', 'COLLECTION_STATUS_RARITY_LOADED', 'COLLECTION_STATUS_READY')`,
    );
    await queryRunner.query(
      `CREATE TABLE "collections" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "address" character varying NOT NULL, "floor" numeric, "floor_nft" character varying, "nfts" character varying array NOT NULL DEFAULT '{}', "status" "public"."collections_status_enum" NOT NULL DEFAULT 'COLLECTION_STATUS_CREATED', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "removed_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_21c00b1ebbd41ba1354242c5c4e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_6a20f6af50eaccf584e5e2a9a6" ON "collections" ("address") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX "public"."IDX_6a20f6af50eaccf584e5e2a9a6"`,
    );
    await queryRunner.query(`DROP TABLE "collections"`);
    await queryRunner.query(`DROP TYPE "public"."collections_status_enum"`);
  }
}
