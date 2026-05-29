-- AlterTable
ALTER TABLE "questions" ADD COLUMN "explanation" TEXT NOT NULL DEFAULT '';
ALTER TABLE "questions" ALTER COLUMN "explanation" DROP DEFAULT;
