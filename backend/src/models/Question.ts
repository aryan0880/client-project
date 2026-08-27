import mongoose, { Document, Schema } from 'mongoose';

export type QuestionType = 'rating' | 'yesno' | 'text';

export interface IQuestion extends Document {
  text: string;
  type: QuestionType;
  points: number;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    text: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['rating', 'yesno', 'text'],
      default: 'rating',
    },
    points: {
      type: Number,
      required: true,
      min: 0,
      default: 1,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Question = mongoose.model<IQuestion>('Question', questionSchema);
