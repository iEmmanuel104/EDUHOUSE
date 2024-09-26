import { Transaction, Op, FindAndCountOptions } from 'sequelize';
import QuestionBank, { IQuestionBank } from '../models/evaluation/questionBank.model';
import { NotFoundError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';
import Admin from '../models/admin.model';
import { SchoolAdminPermissions } from '../models/schoolAdmin.model';
import SchoolService from './school.service';
import Assessment from '../models/evaluation/assessment.model';
import AssessmentQuestion from '../models/evaluation/questions.model';

export interface IViewQuestionsQuery {
    page?: number;
    size?: number;
    q?: string;
    categories?: string[];
}

export default class QuestionBankService {
    static async addOrUpdateAssessmentQuestion(
        assessmentId: string,
        questionData: IQuestionBank & { id?: string },
        user: Admin,
        permission: SchoolAdminPermissions,
        transaction?: Transaction
    ): Promise<{ question: QuestionBank; created: boolean }> {
        const assessment = await Assessment.findByPk(assessmentId, { transaction });
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        await SchoolService.viewSingleSchool(assessment.schoolId.toString(), user, permission);

        let question: QuestionBank;
        let created: boolean;

        if (questionData.id) {
            // Update existing question
            const questionResponse = await QuestionBank.findByPk(questionData.id, { transaction });
            if (!questionResponse) {
                throw new NotFoundError('Question not found');
            }

            await questionResponse.update(questionData, { transaction });
            question = questionResponse;
            created = false;
        } else {
            // Create new question
            question = await QuestionBank.create(questionData, { transaction });
            await AssessmentQuestion.create({
                assessmentId,
                questionId: question.id,
                order: (await AssessmentQuestion.count({ where: { assessmentId }, transaction })) + 1,
                isCustom: false,
            }, { transaction });
            created = true;
        }

        return { question, created };
    }

    static async removeQuestionFromAssessment(
        assessmentId: string,
        questionId: string,
        user: Admin,
        permission: SchoolAdminPermissions,
        transaction?: Transaction
    ): Promise<void> {
        const assessment = await Assessment.findByPk(assessmentId, { transaction });
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        await SchoolService.viewSingleSchool(assessment.schoolId.toString(), user, permission);

        const assessmentQuestion = await AssessmentQuestion.findOne({
            where: { assessmentId, questionId },
            transaction,
        });

        if (!assessmentQuestion) {
            throw new NotFoundError('Question not found in this assessment');
        }

        await assessmentQuestion.destroy({ transaction });
    }

    static async viewAssessmentQuestions(
        assessmentId: string,
        queryData?: IViewQuestionsQuery
    ): Promise<{ questions: QuestionBank[], count: number, totalPages?: number }> {
        const { page, size, q: query, categories } = queryData || {};

        const where: Record<string | symbol, unknown> = {};

        if (query) {
            where[Op.or] = [
                { question: { [Op.iLike]: `%${query}%` } },
            ];
        }

        if (categories && categories.length > 0) {
            where.categories = { [Op.overlap]: categories };
        }

        const queryOptions: FindAndCountOptions<QuestionBank> = {
            where,
            include: [{
                model: AssessmentQuestion,
                where: { assessmentId },
                attributes: ['order', 'isCustom'],
            }],
        };

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows: questions, count } = await QuestionBank.findAndCountAll(queryOptions);

        if (page && size && questions.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { questions, count, ...totalPages };
        } else {
            return { questions, count };
        }
    }
}