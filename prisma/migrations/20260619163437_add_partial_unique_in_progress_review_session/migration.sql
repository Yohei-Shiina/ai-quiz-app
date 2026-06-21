/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `review_sessions` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "review_sessions_userId_key" ON "review_sessions"("userId") WHERE (status = 'in_progress');
