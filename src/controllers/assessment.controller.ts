import { Request, Response } from 'express';
import AssessmentService, { IViewAssessmentsQuery, IViewAssessmentTakersQuery } from '../services/assessment.service';
import { AdminAuthenticatedRequest, AuthenticatedRequest } from '../middlewares/authMiddleware';
import { AssessmentTakerStatus } from '../models/evaluation/takers.model';

export default class AssessmentController {
    static async createAssessment(req: AdminAuthenticatedRequest, res: Response) {
        const assessmentData = req.body;

        const Admin = (req as AdminAuthenticatedRequest).admin;

        const newAssessment = await AssessmentService.addAssessment(assessmentData, Admin);

        res.status(201).json({
            status: 'success',
            message: 'Assessment created successfully',
            data: {
                assessment: newAssessment,
            },
        });
    }

    static async getAssessments(req: Request, res: Response) {
        const queryData: IViewAssessmentsQuery = req.query;

        const { assessments, count, totalPages } = await AssessmentService.viewAssessments(queryData);

        res.status(200).json({
            status: 'success',
            message: 'Assessments retrieved successfully',
            data: {
                assessments,
                count,
                totalPages,
            },
        });
    }

    static async getAssessment(req: Request, res: Response) {
        const { id } = req.params;

        const assessment = await AssessmentService.viewSingleAssessment(id);

        res.status(200).json({
            status: 'success',
            message: 'Assessment retrieved successfully',
            data: {
                assessment,
            },
        });
    }

    static async updateAssessment(req: AdminAuthenticatedRequest, res: Response) {
        const { id } = req.params;
        const updateData = req.body;

        const Admin = (req as AdminAuthenticatedRequest).admin;

        const updatedAssessment = await AssessmentService.updateAssessment(id, updateData, Admin);

        res.status(200).json({
            status: 'success',
            message: 'Assessment updated successfully',
            data: {
                assessment: updatedAssessment,
            },
        });
    }

    static async deleteAssessment(req: AdminAuthenticatedRequest, res: Response) {
        const { id } = req.params;

        const Admin = (req as AdminAuthenticatedRequest).admin;

        await AssessmentService.deleteAssessment(id, Admin);

        res.status(200).json({
            status: 'success',
            message: 'Assessment deleted successfully',
            data: null,
        });
    }


    // assessment taker
    static async assignAssessmentToUser(req: AdminAuthenticatedRequest, res: Response) {
        const takerData = req.body;

        const Admin = (req as AdminAuthenticatedRequest).admin;

        const newTaker = await AssessmentService.addAssessmentTaker(takerData, Admin);

        res.status(201).json({
            status: 'success',
            message: 'Assessment assigned to user successfully',
            data: {
                taker: newTaker,
            },
        });
    }

    static async getAssessmentTakers(req: Request, res: Response) {
        const queryData: IViewAssessmentTakersQuery = req.query;

        const { takers, count, totalPages } = await AssessmentService.viewAssessmentTakers(queryData);

        res.status(200).json({
            status: 'success',
            message: 'Assessment takers retrieved successfully',
            data: {
                takers,
                count,
                totalPages,
            },
        });
    }

    static async getAssessmentTaker(req: Request, res: Response) {
        const { id } = req.params;

        const taker = await AssessmentService.viewSingleAssessmentTaker(id);

        res.status(200).json({
            status: 'success',
            message: 'Assessment taker retrieved successfully',
            data: {
                taker,
            },
        });
    }

    static async updateAssessmentTaker(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        const updateData = req.body;

        const updatedTaker = await AssessmentService.updateAssessmentTaker(id, updateData);

        res.status(200).json({
            status: 'success',
            message: 'Assessment taker updated successfully',
            data: {
                taker: updatedTaker,
            },
        });
    }

    static async deleteAssessmentTaker(req: AdminAuthenticatedRequest, res: Response) {
        const { id } = req.params;

        const Admin = (req as AdminAuthenticatedRequest).admin;

        await AssessmentService.deleteAssessmentTaker(id, Admin);

        res.status(200).json({
            status: 'success',
            message: 'Assessment taker deleted successfully',
            data: null,
        });
    }

    static async startAssessment(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;

        const updatedTaker = await AssessmentService.updateAssessmentTaker(id, {
            status: AssessmentTakerStatus.ONGOING,
            startedAt: new Date(),
        });

        res.status(200).json({
            status: 'success',
            message: 'Assessment started successfully',
            data: {
                taker: updatedTaker,
            },
        });
    }

    static async submitAssessment(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        const { answers } = req.body;

        const updatedTaker = await AssessmentService.updateAssessmentTaker(id, {
            status: AssessmentTakerStatus.COMPLETED,
            completedAt: new Date(),
            answers,
            // Note: You might want to calculate the score here or in a separate service method
        });

        res.status(200).json({
            status: 'success',
            message: 'Assessment submitted successfully',
            data: {
                taker: updatedTaker,
            },
        });
    }

}