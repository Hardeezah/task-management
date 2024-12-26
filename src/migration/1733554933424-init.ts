import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1733554933424 implements MigrationInterface {
    name = 'Init1733554933424'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."task_status_enum" AS ENUM('pending', 'in-progress', 'completed')`);
        await queryRunner.query(`CREATE TABLE "task" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying NOT NULL, "description" text NOT NULL, "dueDate" TIMESTAMP NOT NULL, "status" "public"."task_status_enum" NOT NULL DEFAULT 'pending', "priority" character varying NOT NULL DEFAULT 'medium', "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "createdById" uuid, CONSTRAINT "PK_fb213f79ee45060ba925ecd576e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "username" character varying, "password" character varying, "googleId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "UQ_78a916df40e02a9deb1c4b75edb" UNIQUE ("username"), CONSTRAINT "UQ_470355432cc67b2c470c30bef7c" UNIQUE ("googleId"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "task_assigned_to_user" ("taskId" uuid NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_68515c563784b7134eb71c9d3b1" PRIMARY KEY ("taskId", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ec6b292ff7318aae5661817802" ON "task_assigned_to_user" ("taskId") `);
        await queryRunner.query(`CREATE INDEX "IDX_19239a57ca00ec214c34fec508" ON "task_assigned_to_user" ("userId") `);
        await queryRunner.query(`ALTER TABLE "task" ADD CONSTRAINT "FK_91d76dd2ae372b9b7dfb6bf3fd2" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_assigned_to_user" ADD CONSTRAINT "FK_ec6b292ff7318aae56618178021" FOREIGN KEY ("taskId") REFERENCES "task"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "task_assigned_to_user" ADD CONSTRAINT "FK_19239a57ca00ec214c34fec508d" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "task_assigned_to_user" DROP CONSTRAINT "FK_19239a57ca00ec214c34fec508d"`);
        await queryRunner.query(`ALTER TABLE "task_assigned_to_user" DROP CONSTRAINT "FK_ec6b292ff7318aae56618178021"`);
        await queryRunner.query(`ALTER TABLE "task" DROP CONSTRAINT "FK_91d76dd2ae372b9b7dfb6bf3fd2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_19239a57ca00ec214c34fec508"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ec6b292ff7318aae5661817802"`);
        await queryRunner.query(`DROP TABLE "task_assigned_to_user"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`DROP TYPE "public"."task_status_enum"`);
    }

}
