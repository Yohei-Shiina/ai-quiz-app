/*
  Warnings:

  - The `status` column on the `quiz_sessions` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "QuizSessionStatus" AS ENUM ('in_progress', 'completed');

-- AlterTable
ALTER TABLE "quiz_sessions" DROP COLUMN "status",
ADD COLUMN     "status" "QuizSessionStatus" NOT NULL DEFAULT 'in_progress';
