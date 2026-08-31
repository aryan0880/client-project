import mongoose, { Document, Schema } from 'mongoose';

export type AssignmentStatus = 'pending' | 'submitted';

export interface ISurveyAssignment extends Document {
  survey: mongoose.Types.ObjectId;
  supplier: mongoose.Types.ObjectId;
  /** Cryptographically random token embedded in the supplier's survey URL */
  token: string;
  status: AssignmentStatus;
  sentAt?: Date;
  submittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const surveyAssignmentSchema = new Schema<ISurveyAssignment>(
  {
    survey: {
      type: Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
    },
    supplier: {
      type: Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    token: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'submitted'],
      default: 'pending',
    },
    sentAt: {
      type: Date,
    },
    submittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate assignments of the same survey to the same supplier
surveyAssignmentSchema.index({ survey: 1, supplier: 1 }, { unique: true });

export const SurveyAssignment = mongoose.model<ISurveyAssignment>(
  'SurveyAssignment',
  surveyAssignmentSchema
);
