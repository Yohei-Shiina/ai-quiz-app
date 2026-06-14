-- DropForeignKey
ALTER TABLE "answer_options" DROP CONSTRAINT "answer_options_questionId_fkey";

-- DropForeignKey
ALTER TABLE "questions" DROP CONSTRAINT "questions_topicId_fkey";

-- DropForeignKey
ALTER TABLE "quiz_sessions" DROP CONSTRAINT "quiz_sessions_topicId_fkey";

-- DropForeignKey
ALTER TABLE "session_answers" DROP CONSTRAINT "session_answers_answerOptionId_fkey";

-- DropForeignKey
ALTER TABLE "session_answers" DROP CONSTRAINT "session_answers_questionId_fkey";

-- DropForeignKey
ALTER TABLE "session_answers" DROP CONSTRAINT "session_answers_quizSessionId_fkey";

-- DropForeignKey
ALTER TABLE "session_questions" DROP CONSTRAINT "session_questions_questionId_fkey";

-- DropForeignKey
ALTER TABLE "session_questions" DROP CONSTRAINT "session_questions_quizSessionId_fkey";

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "answer_options" ADD CONSTRAINT "answer_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quiz_sessions" ADD CONSTRAINT "quiz_sessions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_quizSessionId_fkey" FOREIGN KEY ("quizSessionId") REFERENCES "quiz_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_questions" ADD CONSTRAINT "session_questions_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_quizSessionId_fkey" FOREIGN KEY ("quizSessionId") REFERENCES "quiz_sessions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "session_answers" ADD CONSTRAINT "session_answers_answerOptionId_fkey" FOREIGN KEY ("answerOptionId") REFERENCES "answer_options"("id") ON DELETE CASCADE ON UPDATE CASCADE;
