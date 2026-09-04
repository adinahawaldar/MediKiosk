import mongoose, { Document, Schema } from 'mongoose';

export interface IPrescriptionVersion extends Document {
  prescriptionId: mongoose.Types.ObjectId;
  consultationId: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  version: number;
  medications: string[];
  instructions: string;
  status: 'draft' | 'active' | 'completed';
  changedBy?: string;
  changeReason?: string;
  createdAt: Date;
}

const PrescriptionVersionSchema = new Schema<IPrescriptionVersion>({
  prescriptionId: { type: Schema.Types.ObjectId, ref: 'Prescription', required: true, index: true },
  consultationId: { type: Schema.Types.ObjectId, ref: 'Consultation', required: true },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  version: { type: Number, required: true },
  medications: { type: [String], default: [] },
  instructions: { type: String, required: true },
  status: { type: String, enum: ['draft', 'active', 'completed'], required: true },
  changedBy: { type: String },
  changeReason: { type: String },
}, { timestamps: { createdAt: true, updatedAt: false } });

export const PrescriptionVersion = mongoose.model<IPrescriptionVersion>('PrescriptionVersion', PrescriptionVersionSchema);
export default PrescriptionVersion;
