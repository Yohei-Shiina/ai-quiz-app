-- CreateEnum
CREATE TYPE "ReviewSessionStatus" AS ENUM ('in_progress', 'completed');

-- CreateTable
CREATE TABLE "question_review_states" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "box" INTEGER NOT NULL,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "question_review_states_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ReviewSessionStatus" NOT NULL DEFAULT 'in_progress',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_session_questions" (
    "id" TEXT NOT NULL,
    "reviewSessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_session_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "review_session_answers" (
    "id" TEXT NOT NULL,
    "reviewSessionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answerOptionId" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "review_session_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "question_review_states_questionId_key" ON "question_review_states"("questionId");

-- CreateIndex
CREATE INDEX "question_review_states_userId_dueAt_idx" ON "question_review_states"("userId", "dueAt");

-- CreateIndex
CREATE INDEX "review_sessions_userId_status_idx" ON "review_sessions"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "review_session_questions_reviewSessionId_questionId_key" ON "review_session_questions"("reviewSessionId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "review_session_answers_reviewSessionId_questionId_key" ON "review_session_answers"("reviewSessionId", "questionId");

-- AddForeignKey
ALTER TABLE "question_review_states" ADD CONSTRAINT "question_review_states_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "question_review_states" ADD CONSTRAINT "question_review_states_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_sessions" ADD CONSTRAINT "review_sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_session_questions" ADD CONSTRAINT "review_session_questions_reviewSessionId_fkey" FOREIGN KEY ("reviewSessionId") REFERENCES "review_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_session_questions" ADD CONSTRAINT "review_session_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_session_answers" ADD CONSTRAINT "review_session_answers_reviewSessionId_fkey" FOREIGN KEY ("reviewSessionId") REFERENCES "review_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_session_answers" ADD CONSTRAINT "review_session_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "review_session_answers" ADD CONSTRAINT "review_session_answers_answerOptionId_fkey" FOREIGN KEY ("answerOptionId") REFERENCES "answer_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
