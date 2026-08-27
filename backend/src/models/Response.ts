import mongoose, { Document, Schema } from 'mongoose';

export interface IAnswer {
  question: mongoose.Types.ObjectId;
  /** Raw answer value — string covers rating, yesno, and text responses */
  value: string;
}

export interface IResponse extends Document {
  assignment: mongoose.Types.ObjectId;
  answers: IAnswer[];
  /**
   * Calculated total score — populated server-side only (Phase 2).
   * Never trust or accept a score from the client.
   */
  totalScore?: number;
  maxPossibleScore?: number;
  createdAt: Date;
  updatedAt: Date;
}

const answerSchema = new Schema<IAnswer>(
  {
    question: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

const responseSchema = new Schema<IResponse>(
  {
    assignment: {
      type: Schema.Types.ObjectId,
      ref: 'SurveyAssignment',
      required: true,
      unique: true, // One response per assignment
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    totalScore: {
      type: Number,
    },
    maxPossibleScore: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

export const Response = mongoose.model<IResponse>('Response', responseSchema);
