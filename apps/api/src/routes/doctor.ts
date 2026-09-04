import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Consultation } from '../models/Consultation.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { Prescription } from '../models/Prescription.js';
import { PrescriptionVersion } from '../models/PrescriptionVersion.js';
import { LabReport } from '../models/LabReport.js';
import { MedicalDocument } from '../models/MedicalDocument.js';
import { config } from '../config/env.js';
import { deterministicMedicationSafetyCheck } from '../services/medicationSafety.js';

const router = Router();

const objectIdParam = (id: string) => {
  if (!/^[a-f\d]{24}$/i.test(id)) throw new Error('Invalid MongoDB id');
  return id;
};

const prescriptionSchema = z.object({
  consultationId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  patientId: z.string().regex(/^[a-f\d]{24}$/i),
  medications: z.array(z.string().trim().min(1)).min(1),
  instructions: z.string().trim().min(1),
  status: z.enum(['draft', 'active', 'completed']).default('draft'),
  changedBy: z.string().trim().max(120).optional(),
  changeReason: z.string().trim().max(500).optional(),
});

const prescriptionUpdateSchema = prescriptionSchema.partial().omit({ patientId: true, consultationId: true });

const prescriptionSafetySchema = z.object({
  patientId: z.string().regex(/^[a-f\d]{24}$/i),
  prescriptionId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  medications: z.array(z.string().trim().min(1)).min(1),
});

const consultationUpdateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'completed']).optional(),
  diagnosis: z.string().trim().max(2000).optional(),
  treatmentPlan: z.string().trim().max(4000).optional(),
  findings: z.string().trim().max(4000).optional(),
  soapNotes: z.object({
    subjective: z.string().optional(), objective: z.string().optional(),
    assessment: z.string().optional(), plan: z.string().optional(),
  }).partial().optional(),
  priority: z.enum(['emergency', 'urgent', 'routine']).optional(),
  triageScore: z.number().min(0).max(100).optional(),
  triageOverrideReason: z.string().trim().max(500).optional(),
  triageOverrideBy: z.string().trim().max(120).optional(),
});

const documentReviewSchema = z.object({
  extractedDiagnosis: z.string().trim().max(2000).optional(),
  extractedMedications: z.array(z.object({ name: z.string().trim().min(1).max(200), dosage: z.string().trim().max(120).optional() })).optional(),
  extractedLabValues: z.array(z.object({ test: z.string().trim().min(1).max(120), result: z.string().trim().max(120), unit: z.string().trim().max(40).optional(), referenceRange: z.string().trim().max(120).optional(), isAbnormal: z.boolean().optional() })).optional(),
  extractedVitals: z.object({ temperature: z.string().trim().max(40).optional(), bloodPressure: z.string().trim().max(40).optional(), bloodSugar: z.string().trim().max(40).optional(), spo2: z.string().trim().max(40).optional(), pulse: z.string().trim().max(40).optional(), recordedAt: z.string().trim().max(80).optional() }).optional(),
  abnormalLabFlags: z.array(z.string().trim().min(1).max(500)).optional(),
  summary: z.string().trim().max(3000).optional(),
  reviewNotes: z.string().trim().max(2000).optional(),
  reviewedBy: z.string().trim().min(1).max(120),
});

/** GET /api/v1/doctor/consultations/:id/summary */
router.get('/consultations/:id/summary', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = objectIdParam(req.params.id);
    const consultation = await Consultation.findById(id).populate('patientId').populate('doctorId').exec();
    if (!consultation) return res.status(404).json({ success: false, error: 'Consultation not found' });

    const patientId = (consultation.patientId as any)._id || consultation.patientId;
    const [prescriptions, prescriptionVersions, labReports, medicalDocuments, priorConsultations] = await Promise.all([
      Prescription.find({ patientId }).sort({ updatedAt: -1 }).lean().exec(),
      PrescriptionVersion.find({ patientId }).sort({ createdAt: -1 }).lean().exec(),
      LabReport.find({ patientId }).sort({ createdAt: -1 }).limit(12).lean().exec(),
      MedicalDocument.find({ patientId }).sort({ createdAt: -1 }).limit(12).lean().exec(),
      Consultation.find({ patientId, _id: { $ne: consultation._id } }).sort({ createdAt: -1 }).limit(8).lean().exec(),
    ]);

    const timeline = [
      ...priorConsultations.map((visit: any) => ({
        date: visit.createdAt,
        type: 'Consultation',
        title: visit.chiefComplaint || visit.symptoms?.join(', ') || 'OPD visit',
        details: [visit.diagnosis, visit.treatmentPlan, visit.triageNotes].filter(Boolean).join(' · '),
        priority: visit.priority || 'routine',
      })),
      ...prescriptions.map((prescription: any) => ({
        date: prescription.updatedAt || prescription.createdAt,
        type: 'Prescription',
        title: (prescription.medications || []).join(', '),
        details: prescription.instructions || `Version ${prescription.version || 1}`,
        priority: 'routine',
      })),
      ...labReports.map((lab: any) => ({
        date: lab.createdAt,
        type: 'Lab report',
        title: lab.testName || 'Laboratory report',
        details: lab.aiSummary || lab.rawText || 'Lab report available',
        priority: 'routine',
      })),
      ...medicalDocuments.map((document: any) => ({
        date: document.createdAt,
        type: document.documentType || 'Medical document',
        title: document.fileName || 'Scanned document',
        details: document.summary || document.extractedDiagnosis || 'Scanned record available',
        priority: 'routine',
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let longitudinalSummary = 'No previous clinical records are available for synthesis.';
    if (timeline.length > 0) {
      longitudinalSummary = `Patient history contains ${priorConsultations.length} prior consultation(s), ${prescriptions.length} prescription(s), ${labReports.length} lab report(s), and ${medicalDocuments.length} scanned document(s). Review the timeline for longitudinal context.`;
      try {
        const aiResponse = await fetch(`${config.aiServiceUrl}/api/v1/agent/medikiosk/summary`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ historyData: {
            chiefComplaint: consultation.chiefComplaint,
            priorConsultations: timeline,
            scannedDocuments: medicalDocuments,
            prescriptions,
          }, language: 'en' }),
        });
        if (aiResponse.ok) {
          const aiData = await aiResponse.json() as any;
          longitudinalSummary = aiData.data?.structuredSOAP?.priorInvestigations || aiData.data?.bilingualAudioConfirmation?.doctorEnglishSummary || longitudinalSummary;
        }
      } catch { /* deterministic summary remains available when AI is offline */ }
    }

    return res.json({ success: true, data: { consultation, prescriptions, prescriptionVersions, labReports, medicalDocuments, priorConsultations, timeline, longitudinalSummary } });
  } catch (error) { next(error); }
});

/** GET /api/v1/doctor/documents/:id */
router.get('/documents/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const document = await MedicalDocument.findById(objectIdParam(req.params.id)).lean().exec();
    if (!document) return res.status(404).json({ success: false, error: 'Medical document not found' });
    return res.json({ success: true, data: document });
  } catch (error) { next(error); }
});

/** PATCH /api/v1/doctor/documents/:id/review - preserve OCR and save physician corrections */
router.patch('/documents/:id/review', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = documentReviewSchema.parse(req.body);
    const document = await MedicalDocument.findById(objectIdParam(req.params.id)).exec();
    if (!document) return res.status(404).json({ success: false, error: 'Medical document not found' });

    if (!document.originalExtraction) {
      document.originalExtraction = {
        extractedDiagnosis: document.extractedDiagnosis || '',
        extractedMedications: document.extractedMedications || [],
        extractedLabValues: document.extractedLabValues || [],
        extractedVitals: document.extractedVitals || {},
        abnormalLabFlags: document.abnormalLabFlags || [],
        summary: document.summary || '',
      };
    }
    if (parsed.extractedDiagnosis !== undefined) document.extractedDiagnosis = parsed.extractedDiagnosis;
    if (parsed.extractedMedications !== undefined) document.extractedMedications = parsed.extractedMedications;
    if (parsed.extractedLabValues !== undefined) document.extractedLabValues = parsed.extractedLabValues;
    if (parsed.extractedVitals !== undefined) document.extractedVitals = parsed.extractedVitals;
    if (parsed.abnormalLabFlags !== undefined) document.abnormalLabFlags = parsed.abnormalLabFlags;
    if (parsed.summary !== undefined) document.summary = parsed.summary;
    document.reviewNotes = parsed.reviewNotes;
    document.reviewedBy = parsed.reviewedBy;
    document.reviewedAt = new Date();
    document.status = 'reviewed';
    await document.save();
    return res.json({ success: true, data: document, message: 'Medical document reviewed and saved.' });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: error.issues });
    next(error);
  }
});

/** GET /api/v1/doctor/patients/:patientId/prescriptions */
router.get('/patients/:patientId/prescriptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = objectIdParam(req.params.patientId);
    const [prescriptions, versions] = await Promise.all([
      Prescription.find({ patientId }).sort({ updatedAt: -1 }).lean().exec(),
      PrescriptionVersion.find({ patientId }).sort({ createdAt: -1 }).lean().exec(),
    ]);
    return res.json({ success: true, data: { prescriptions, versions } });
  } catch (error) { next(error); }
});

/** POST /api/v1/doctor/prescriptions */
router.post('/prescriptions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = prescriptionSchema.parse(req.body);
    const prescription = await Prescription.create({ ...parsed, version: 1 });
    return res.status(201).json({ success: true, data: prescription });
  } catch (error) { next(error); }
});

/** POST /api/v1/doctor/prescriptions/precheck - run medication safety checks before saving */
router.post('/prescriptions/precheck', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = prescriptionSafetySchema.parse(req.body);
    const patient = await Patient.findById(parsed.patientId).lean().exec();
    if (!patient) return res.status(404).json({ success: false, error: 'Patient not found' });

    const prescriptionQuery: any = { patientId: parsed.patientId, status: { $in: ['draft', 'active'] } };
    if (parsed.prescriptionId) prescriptionQuery._id = { $ne: parsed.prescriptionId };
    const currentPrescriptions = await Prescription.find(prescriptionQuery).select('medications').lean().exec();
    const currentMedications = currentPrescriptions.flatMap((prescription) => prescription.medications || []);

    let result: { warnings?: string[]; isConflict?: boolean };
    try {
      const aiResponse = await fetch(`${config.aiServiceUrl}/api/v1/agent/medication-safety/check`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allergies: patient.allergies || [], medications: parsed.medications, current_medications: currentMedications }),
      });
      if (!aiResponse.ok) throw new Error(`Medication safety service returned ${aiResponse.status}`);
      result = await aiResponse.json() as { warnings?: string[]; isConflict?: boolean };
    } catch {
      result = deterministicMedicationSafetyCheck(patient.allergies || [], parsed.medications, currentMedications);
    }

    return res.json({
      success: true,
      data: {
        warnings: result.warnings || [],
        isConflict: Boolean(result.isConflict),
        checkedMedications: parsed.medications,
        currentMedications,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) return res.status(400).json({ success: false, error: error.issues });
    next(error);
  }
});

/** PATCH /api/v1/doctor/prescriptions/:id - snapshot old content before editing */
router.patch('/prescriptions/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = objectIdParam(req.params.id);
    const updates = prescriptionUpdateSchema.parse(req.body);
    const prescription = await Prescription.findById(id).exec();
    if (!prescription) return res.status(404).json({ success: false, error: 'Prescription not found' });

    await PrescriptionVersion.create({
      prescriptionId: prescription._id,
      consultationId: prescription.consultationId,
      patientId: prescription.patientId,
      version: prescription.version || 1,
      medications: prescription.medications,
      instructions: prescription.instructions,
      status: prescription.status,
      changedBy: updates.changedBy,
      changeReason: updates.changeReason || 'Prescription edited by physician',
    });

    const { changedBy: _changedBy, changeReason: _changeReason, ...prescriptionFields } = updates;
    Object.assign(prescription, prescriptionFields, { version: (prescription.version || 1) + 1 });
    await prescription.save();
    return res.json({ success: true, data: prescription });
  } catch (error) { next(error); }
});

/** GET /api/v1/doctor/prescriptions/:id/versions */
router.get('/prescriptions/:id/versions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescriptionId = objectIdParam(req.params.id);
    const versions = await PrescriptionVersion.find({ prescriptionId }).sort({ version: -1 }).lean().exec();
    return res.json({ success: true, data: versions });
  } catch (error) { next(error); }
});

/**
 * GET /api/v1/doctor/consultations
 * Retrieve all consultations in the doctor queue, prioritized by triage severity.
 */
router.get('/consultations', async (req: Request, res: Response) => {
  try {
    const { status, doctorId } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    } else {
      query.status = { $in: ['open', 'in_progress'] };
    }

    if (doctorId) {
      query.doctorId = doctorId;
    }

    const consultations = await Consultation.find(query)
      .populate('patientId')
      .populate('doctorId')
      .sort({ createdAt: -1 })
      .exec();

    // Guarantee emergency > urgent > routine priority ordering
    const priorityWeight: Record<string, number> = { emergency: 1, urgent: 2, routine: 3 };
    consultations.sort((a, b) => {
      const wA = priorityWeight[a.priority || 'routine'] || 3;
      const wB = priorityWeight[b.priority || 'routine'] || 3;
      if (wA !== wB) return wA - wB;
      if ((b.triageScore || 0) !== (a.triageScore || 0)) return (b.triageScore || 0) - (a.triageScore || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return res.json({
      success: true,
      data: {
        total: consultations.length,
        consultations,
      },
    });
  } catch (error: any) {
    console.error('Error fetching doctor consultations:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch doctor consultations',
    });
  }
});

/**
 * GET /api/v1/doctor/consultations/:id
 * Retrieve full details of a specific consultation, including SOCRATES history and SOAP notes.
 */
router.get('/consultations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const consultation = await Consultation.findById(id)
      .populate('patientId')
      .populate('doctorId')
      .exec();

    if (!consultation) {
      return res.status(404).json({
        success: false,
        error: 'Consultation not found',
      });
    }

    return res.json({
      success: true,
      data: consultation,
    });
  } catch (error: any) {
    console.error('Error fetching consultation details:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch consultation',
    });
  }
});

/**
 * PATCH /api/v1/doctor/consultations/:id
 * Doctor sign-off, update diagnosis, or complete the consultation.
 */
router.patch('/consultations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = consultationUpdateSchema.parse(req.body);
    const { status, diagnosis, treatmentPlan, findings, soapNotes, priority, triageScore, triageOverrideReason, triageOverrideBy } = parsed;

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (diagnosis) updateFields.diagnosis = diagnosis;
    if (treatmentPlan) updateFields.treatmentPlan = treatmentPlan;
    if (findings) updateFields.findings = findings;
    if (soapNotes) updateFields.soapNotes = soapNotes;
    if (priority) updateFields.priority = priority;
    if (triageScore !== undefined) updateFields.triageScore = triageScore;
    if (triageOverrideReason) updateFields.triageOverrideReason = triageOverrideReason;
    if (triageOverrideBy) updateFields.triageOverrideBy = triageOverrideBy;

    const updated = await Consultation.findByIdAndUpdate(id, { $set: updateFields }, { new: true })
      .populate('patientId')
      .populate('doctorId')
      .exec();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: 'Consultation not found to update',
      });
    }

    return res.json({
      success: true,
      data: updated,
      message: 'Consultation successfully updated',
    });
  } catch (error: any) {
    console.error('Error updating consultation:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update consultation',
    });
  }
});

/**
 * GET /api/v1/doctor/list
 * Get list of available doctors for queue assignment
 */
router.get('/list', async (req: Request, res: Response) => {
  try {
    const doctors = await Doctor.find({ status: 'active' }).exec();
    return res.json({
      success: true,
      data: doctors,
    });
  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch doctors',
    });
  }
});

export default router;
