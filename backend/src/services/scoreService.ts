import { Question } from '../models/Question';
import type { IAnswer } from '../models/Response';

export interface ScoreResult {
  totalScore: number;
  maxPossibleScore: number;
  percentageScore: number;
}

/**
 * Calculates the score for a set of answers.
 * Score is always calculated SERVER-SIDE — never trust client-submitted scores.
 *
 * Scoring rules:
 *  - 'yesno': Full points for "Yes", 0 for "No"
 *  - 'rating': Proportional — e.g. rating 4/5 on a 1-point question = 0.8 pts
 *  - 'text': Always full points (acknowledged)
 */
export async function calculateScore(answers: IAnswer[]): Promise<ScoreResult> {
  const questionIds = answers.map((a) => a.question.toString());
  const questions = await Question.find({ _id: { $in: questionIds } });

  const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

  let totalScore = 0;
  let maxPossibleScore = 0;

  for (const answer of answers) {
    const question = questionMap.get(answer.question.toString());
    if (!question) continue;

    maxPossibleScore += question.points;

    switch (question.type) {
      case 'yesno':
        if (answer.value.toLowerCase() === 'yes') {
          totalScore += question.points;
        }
        break;

      case 'rating': {
        // Rating is 1-5; award proportional points
        const rating = parseInt(answer.value, 10);
        if (!isNaN(rating) && rating >= 1 && rating <= 5) {
          totalScore += (rating / 5) * question.points;
        }
        break;
      }

      case 'text':
        // Full credit for any non-empty text response
        if (answer.value.trim().length > 0) {
          totalScore += question.points;
        }
        break;
    }
  }

  // Round to 2 decimal places
  totalScore = Math.round(totalScore * 100) / 100;
  const percentageScore = maxPossibleScore > 0
    ? Math.round((totalScore / maxPossibleScore) * 100)
    : 0;

  return { totalScore, maxPossibleScore, percentageScore };
}
