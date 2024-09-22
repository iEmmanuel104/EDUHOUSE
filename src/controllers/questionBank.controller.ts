import { Request, Response } from 'express';
import QuestionBankService, { IViewQuestionsQuery } from '../services/questionBank.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export default class QuestionBankController {
    static async createQuestion(req: AuthenticatedRequest, res: Response) {
        const questionData = req.body;

        const newQuestion = await QuestionBankService.addQuestion(questionData);

        res.status(201).json({
            status: 'success',
            message: 'Question created successfully',
            data: {
                question: newQuestion,
            },
        });
    }

    static async getQuestions(req: Request, res: Response) {
        const queryData: IViewQuestionsQuery = req.query;

        const { questions, count, totalPages } = await QuestionBankService.viewQuestions(queryData);

        res.status(200).json({
            status: 'success',
            message: 'Questions retrieved successfully',
            data: {
                questions,
                count,
                totalPages,
            },
        });
    }

    static async getQuestion(req: Request, res: Response) {
        const { id } = req.params;

        const question = await QuestionBankService.viewSingleQuestion(id);

        res.status(200).json({
            status: 'success',
            message: 'Question retrieved successfully',
            data: {
                question,
            },
        });
    }

    static async updateQuestion(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        const updateData = req.body;

        const updatedQuestion = await QuestionBankService.updateQuestion(id, updateData);

        res.status(200).json({
            status: 'success',
            message: 'Question updated successfully',
            data: {
                question: updatedQuestion,
            },
        });
    }

    static async deleteQuestion(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;

        await QuestionBankService.deleteQuestion(id);

        res.status(200).json({
            status: 'success',
            message: 'Question deleted successfully',
            data: null,
        });
    }
}