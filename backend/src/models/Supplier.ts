import mongoose, { Document, Schema } from 'mongoose';

export type SupplierStatus = 'active' | 'inactive';

export interface ISupplier extends Document {
  name: string;
  email: string;
  status: SupplierStatus;
  contactPerson?: string;
  phone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplierSchema = new Schema<ISupplier>(
  {
    name: {
      type: String,
      required: [true, 'Supplier name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Supplier email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    contactPerson: {
      type: String,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export const Supplier = mongoose.model<ISupplier>('Supplier', supplierSchema);
