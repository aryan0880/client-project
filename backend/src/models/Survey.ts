import mongoose, { Document, Schema } from 'mongoose';

export type SurveyStatus = 'draft' | 'active' | 'closed';

export interface ISurvey extends Document {
  title: string;
  description?: string;
  status: SurveyStatus;
  questions: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const surveySchema = new Schema<ISurvey>(
  {
    title: {
      type: String,
      required: [true, 'Survey title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'closed'],
      default: 'draft',
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Survey = mongoose.model<ISurvey>('Survey', surveySchema);
