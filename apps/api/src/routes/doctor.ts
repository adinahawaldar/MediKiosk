import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { Consultation } from '../models/Consultation.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';
import { Prescription } from '../models/Prescription.js';
import { PrescriptionVersion } from '../models/PrescriptionVersion.js';
import { LabReport } from '../models/LabReport.js';
import { MedicalDocument } from '../models/MedicalDocument.js';

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

    return res.json({ success: true, data: { consultation, prescriptions, prescriptionVersions, labReports, medicalDocuments, priorConsultations } });
  } catch (error) { next(error); }
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
    const { status, diagnosis, treatmentPlan, findings, soapNotes } = req.body;

    const updateFields: any = {};
    if (status) updateFields.status = status;
    if (diagnosis) updateFields.diagnosis = diagnosis;
    if (treatmentPlan) updateFields.treatmentPlan = treatmentPlan;
    if (findings) updateFields.findings = findings;
    if (soapNotes) updateFields.soapNotes = soapNotes;

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
