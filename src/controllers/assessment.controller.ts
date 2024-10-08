import { Request, Response } from 'express';
import AssessmentService, { IViewAssessmentsQuery, IViewAssessmentTakersQuery, IViewQuestionsQuery } from '../services/assessment.service';
import { AdminAuthenticatedRequest, AuthenticatedRequest } from '../middlewares/authMiddleware';
import { AssessmentTakerStatus } from '../models/evaluation/takers.model';
import { BadRequestError } from '../utils/customErrors';
import { SchoolAdminPermissions } from '../models/schoolAdmin.model';
import { Database } from '../models';
import { Transaction } from 'sequelize';

export default class AssessmentController {
    
    static async createAssessment(req: AdminAuthenticatedRequest, res: Response) {
        const assessmentData = req.body;

        if (!assessmentData.questions || assessmentData.questions.length === 0) {
            throw new BadRequestError('Assessment must include questions');
        }

        const Admin = req.admin;

        const newAssessment = await AssessmentService.addAssessment(assessmentData, Admin, SchoolAdminPermissions.CREATE_ASSESSMENT);

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

        const admin = (req as AdminAuthenticatedRequest).admin;
        const user = (req as AuthenticatedRequest).user;

        const { assessments, count, totalPages } = await AssessmentService.viewAssessments(queryData, admin || user);

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
        const { id } = req.query;

        const assessment = await AssessmentService.viewSingleAssessment(id as string);

        res.status(200).json({
            status: 'success',
            message: 'Assessment retrieved successfully',
            data: {
                assessment,
            },
        });
    }

    static async updateAssessment(req: AdminAuthenticatedRequest, res: Response) {
        const { id } = req.query;
        const updateData = req.body;

        const Admin = req.admin;

        const updatedAssessment = await AssessmentService.updateAssessment(id as string, updateData, Admin, SchoolAdminPermissions.UPDATE_ASSESSMENT);

        res.status(200).json({
            status: 'success',
            message: 'Assessment updated successfully',
            data: {
                assessment: updatedAssessment,
            },
        });
    }

    static async deleteAssessment(req: AdminAuthenticatedRequest, res: Response) {
        const { id } = req.query;

        const Admin = req.admin;

        await AssessmentService.deleteAssessment(id as string, Admin, SchoolAdminPermissions.DELETE_ASSESSMENT);

        res.status(200).json({
            status: 'success',
            message: 'Assessment deleted successfully',
            data: null,
        });
    }

    // assessment taker
    static async assignAssessmentToUser(req: AdminAuthenticatedRequest, res: Response) {
        const takerData = req.body;

        const Admin = req.admin;

        const newTaker = await AssessmentService.addAssessmentTaker(takerData, Admin, SchoolAdminPermissions.ADD_ASSESSMENT_TAKER);

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
        const { id } = req.query as { id: string };

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
        const { id } = req.query as { id: string };
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
        const { id } = req.query as { id: string };

        const Admin = req.admin;

        await AssessmentService.deleteAssessmentTaker(id, Admin, SchoolAdminPermissions.REMOVE_ASSESSMENT_TAKER);

        res.status(200).json({
            status: 'success',
            message: 'Assessment taker deleted successfully',
            data: null,
        });
    }

    static async startAssessment(req: AuthenticatedRequest, res: Response) {
        const { id } = req.query as { id: string };

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

    static async gradeAssessment(req: AdminAuthenticatedRequest, res: Response) {
        const { id } = req.query as { id: string };

        if (!id) {
            throw new BadRequestError('Assessment ID is required');
        }

        const gradingResults = await AssessmentService.gradeAssessment(id);

        res.status(200).json({
            status: 'success',
            message: 'Assessment graded successfully',
            data: gradingResults,
        });
    }

    static async submitAssessment(req: AuthenticatedRequest, res: Response) {
        const { id } = req.query as { id: string };
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

    // assessment questions

    static async addOrUpdateAssessmentQuestion(req: AdminAuthenticatedRequest, res: Response) {
        const { id } = req.query as { id: string };
        const questionData = req.body;

        await Database.transaction(async (transaction: Transaction) => {
            const { question, created } = await AssessmentService.addOrUpdateAssessmentQuestion(
                id,
                questionData,
                req.admin,
                SchoolAdminPermissions.UPDATE_ASSESSMENT,
                transaction
            );

            res.status(created ? 201 : 200).json({
                status: 'success',
                message: created ? 'Question added to assessment successfully' : 'Assessment question updated successfully',
                data: {
                    question,
                },
            });
        });
    }

    static async removeQuestionFromAssessment(req: AdminAuthenticatedRequest, res: Response) {
        const { id, questionId } = req.query as { id: string; questionId: string };
        await Database.transaction(async (transaction: Transaction) => {
            await AssessmentService.removeQuestionFromAssessment(
                id,
                questionId,
                req.admin,
                SchoolAdminPermissions.UPDATE_ASSESSMENT,
                transaction
            );

            res.status(200).json({
                status: 'success',
                message: 'Question removed from assessment successfully',
                data: null,
            });
        });
    }

    static async getAssessmentQuestions(req: AuthenticatedRequest, res: Response) {
        const { id } = req.query as { id: string };
        const queryData: IViewQuestionsQuery = req.query;

        const user = req.user;

        const { questions, count, totalPages } = await AssessmentService.viewAssessmentQuestions(
            id,
            queryData,
            user.id,
        );

        res.status(200).json({
            status: 'success',
            message: 'Assessment questions retrieved successfully',
            data: {
                questions,
                count,
                totalPages,
            },
        });
    }

}