import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  consultationId?: mongoose.Types.ObjectId;
  fileName: string;
  documentType: 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Other';
  extractedDiagnosis?: string;
  extractedMedications: Array<{ name: string; dosage?: string }>;
  extractedLabValues: Array<{ test: string; result: string; unit?: string; referenceRange?: string; isAbnormal?: boolean }>;
  abnormalLabFlags: string[];
  summary: string;
  pageCount: number;
  status: 'draft' | 'reviewed';
  createdAt: Date;
  updatedAt: Date;
}

const MedicalDocumentSchema = new Schema<IMedicalDocument>({
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true, index: true },
  consultationId: { type: Schema.Types.ObjectId, ref: 'Consultation' },
  fileName: { type: String, required: true },
  documentType: { type: String, enum: ['Prescription', 'Lab Report', 'Discharge Summary', 'Other'], default: 'Other' },
  extractedDiagnosis: { type: String },
  extractedMedications: { type: [{ name: String, dosage: String }], default: [] },
  extractedLabValues: { type: [{ test: String, result: String, unit: String, referenceRange: String, isAbnormal: Boolean }], default: [] },
  abnormalLabFlags: { type: [String], default: [] },
  summary: { type: String, default: '' },
  pageCount: { type: Number, default: 1 },
  status: { type: String, enum: ['draft', 'reviewed'], default: 'draft' },
}, { timestamps: true });

export const MedicalDocument = mongoose.model<IMedicalDocument>('MedicalDocument', MedicalDocumentSchema);
export default MedicalDocument;
