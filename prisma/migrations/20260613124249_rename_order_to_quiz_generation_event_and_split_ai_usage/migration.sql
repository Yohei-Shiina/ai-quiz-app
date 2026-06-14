/*
  Warnings:

  - You are about to drop the `orders` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "QuizGenerationEventStatus" AS ENUM ('pending', 'success', 'failed');

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_quizSessionId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_topicId_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_userId_fkey";

-- DropTable
DROP TABLE "orders";

-- DropEnum
DROP TYPE "OrderStatus";

-- CreateTable
CREATE TABLE "quiz_generation_events" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "quizSessionId" TEXT,
    "status" "QuizGenerationEventStatus" NOT NULL DEFAULT 'pending',
    "aiModel" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quiz_generation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_usage_records" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "quizGenerationEventId" TEXT,
    "aiModel" TEXT NOT NULL,
    "inputTokens" INTEGER NOT NULL,
    "outputTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "inputTokenDetails" JSONB NOT NULL,
    "outputTokenDetails" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quiz_generation_events_userId_createdAt_idx" ON "quiz_generation_events"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "ai_usage_records_userId_createdAt_idx" ON "ai_usage_records"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "quiz_generation_events" ADD CONSTRAINT "quiz_generation_events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_generation_events" ADD CONSTRAINT "quiz_generation_events_quizSessionId_fkey" FOREIGN KEY ("quizSessionId") REFERENCES "quiz_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_records" ADD CONSTRAINT "ai_usage_records_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_usage_records" ADD CONSTRAINT "ai_usage_records_quizGenerationEventId_fkey" FOREIGN KEY ("quizGenerationEventId") REFERENCES "quiz_generation_events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
