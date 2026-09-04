import { Router, Request, Response } from 'express';
import { Consultation } from '../models/Consultation.js';
import { Doctor } from '../models/Doctor.js';
import { Patient } from '../models/Patient.js';

const router = Router();

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
