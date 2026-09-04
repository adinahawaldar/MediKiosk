import mongoose, { Document, Schema } from 'mongoose';

export interface IMedicalDocument extends Document {
  patientId: mongoose.Types.ObjectId;
  consultationId?: mongoose.Types.ObjectId;
  fileName: string;
  documentType: 'Prescription' | 'Lab Report' | 'Discharge Summary' | 'Other';
  extractedDiagnosis?: string;
  extractedMedications: Array<{ name: string; dosage?: string }>;
  extractedLabValues: Array<{ test: string; result: string; unit?: string; referenceRange?: string; isAbnormal?: boolean }>;
  extractedVitals?: { temperature?: string; bloodPressure?: string; bloodSugar?: string; spo2?: string; pulse?: string; recordedAt?: string };
  abnormalLabFlags: string[];
  summary: string;
  pageCount: number;
  status: 'draft' | 'reviewed';
  originalExtraction?: {
    extractedDiagnosis?: string;
    extractedMedications: Array<{ name: string; dosage?: string }>;
    extractedLabValues: Array<{ test: string; result: string; unit?: string; referenceRange?: string; isAbnormal?: boolean }>;
    extractedVitals?: { temperature?: string; bloodPressure?: string; bloodSugar?: string; spo2?: string; pulse?: string; recordedAt?: string };
    abnormalLabFlags: string[];
    summary: string;
  };
  reviewedBy?: string;
  reviewedAt?: Date;
  reviewNotes?: string;
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
  extractedVitals: {
    temperature: String, bloodPressure: String, bloodSugar: String, spo2: String, pulse: String, recordedAt: String,
  },
  abnormalLabFlags: { type: [String], default: [] },
  summary: { type: String, default: '' },
  pageCount: { type: Number, default: 1 },
  status: { type: String, enum: ['draft', 'reviewed'], default: 'draft' },
  originalExtraction: {
    extractedDiagnosis: String,
    extractedMedications: { type: [{ name: String, dosage: String }], default: [] },
    extractedLabValues: { type: [{ test: String, result: String, unit: String, referenceRange: String, isAbnormal: Boolean }], default: [] },
    extractedVitals: { type: Schema.Types.Mixed },
    abnormalLabFlags: { type: [String], default: [] },
    summary: { type: String, default: '' },
  },
  reviewedBy: { type: String, trim: true, maxlength: 120 },
  reviewedAt: { type: Date },
  reviewNotes: { type: String, trim: true, maxlength: 2000 },
}, { timestamps: true });

export const MedicalDocument = mongoose.model<IMedicalDocument>('MedicalDocument', MedicalDocumentSchema);
export default MedicalDocument;
