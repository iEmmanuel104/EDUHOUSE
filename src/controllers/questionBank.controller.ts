import { Request, Response } from 'express';
import QuestionBankService, { IViewQuestionsQuery } from '../services/questionBank.service';
import { AdminAuthenticatedRequest } from '../middlewares/authMiddleware';
import { SchoolAdminPermissions } from '../models/schoolAdmin.model';
import { Database } from '../models';
import { Transaction } from 'sequelize';

export default class QuestionBankController {
    static async addOrUpdateAssessmentQuestion(req: AdminAuthenticatedRequest, res: Response) {
        const { assessmentId } = req.params;
        const questionData = req.body;

        await Database.transaction(async (transaction: Transaction) => {

            const { question, created } = await QuestionBankService.addOrUpdateAssessmentQuestion(
                assessmentId,
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
        const { assessmentId, questionId } = req.params;
        await Database.transaction(async (transaction: Transaction) => {
            await QuestionBankService.removeQuestionFromAssessment(
                assessmentId,
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

    static async getAssessmentQuestions(req: Request, res: Response) {
        const { assessmentId } = req.params;
        const queryData: IViewQuestionsQuery = req.query;

        const { questions, count, totalPages } = await QuestionBankService.viewAssessmentQuestions(assessmentId, queryData);

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