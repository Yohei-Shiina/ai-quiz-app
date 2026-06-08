/*
  Warnings:

  - A unique constraint covering the columns `[quizSessionId,questionId]` on the table `session_answers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "session_answers_quizSessionId_questionId_key" ON "session_answers"("quizSessionId", "questionId");
