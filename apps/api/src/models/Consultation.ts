import mongoose, { Schema, Document } from 'mongoose';

export interface IConsultation extends Document {
  appointmentId?: mongoose.Types.ObjectId;
  patientId: mongoose.Types.ObjectId;
  doctorId: mongoose.Types.ObjectId;
  symptoms?: string[];
  chiefComplaint?: string;
  socrates?: Record<string, string>;
  socratesRaw?: Record<string, string>;
  historyMode?: 'allopathy' | 'ayush';
  ayushHistory?: Record<string, string>;
  vitals?: { temperature?: number };
  diagnosis?: string;
  treatmentPlan?: string;
  findings?: string;
  status: 'open' | 'in_progress' | 'completed';
  priority?: 'emergency' | 'urgent' | 'routine';
  triageScore?: number;
  triageNotes?: string;
  triageAIEvaluated?: boolean;
  triageOverrideReason?: string;
  triageOverrideBy?: string;
  soapNotes?: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
  allergyOverrideReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ConsultationSchema: Schema = new Schema({
  appointmentId: { type: Schema.Types.ObjectId, ref: 'Appointment' },
  patientId: { type: Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctorId: { type: Schema.Types.ObjectId, ref: 'Doctor', required: true },
  symptoms: { type: [String], default: [] },
  chiefComplaint: { type: String, default: '' },
  socrates: { type: Schema.Types.Mixed, default: {} },
  socratesRaw: { type: Schema.Types.Mixed, default: {} },
  historyMode: { type: String, enum: ['allopathy', 'ayush'], default: 'allopathy' },
  ayushHistory: { type: Schema.Types.Mixed, default: {} },
  vitals: {
    temperature: { type: Number },
  },
  diagnosis: { type: String },
  treatmentPlan: { type: String },
  findings: { type: String },
  status: { type: String, enum: ['open', 'in_progress', 'completed'], default: 'open' },
  priority: { type: String, enum: ['emergency', 'urgent', 'routine'], default: 'routine' },
  triageScore: { type: Number, min: 0, max: 100, default: 0, index: true },
  triageNotes: { type: String },
  triageAIEvaluated: { type: Boolean, default: false },
  triageOverrideReason: { type: String },
  triageOverrideBy: { type: String },
  soapNotes: {
    subjective: { type: String, default: '' },
    objective: { type: String, default: '' },
    assessment: { type: String, default: '' },
    plan: { type: String, default: '' }
  },
  allergyOverrideReason: { type: String }
}, {
  timestamps: true
});

ConsultationSchema.index({ patientId: 1, createdAt: -1 });
ConsultationSchema.index({ status: 1, priority: 1, triageScore: -1, createdAt: -1 });

export const Consultation = mongoose.model<IConsultation>('Consultation', ConsultationSchema);
export default Consultation;
