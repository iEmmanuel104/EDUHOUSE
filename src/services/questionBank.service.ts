import { Transaction, Op, FindAndCountOptions } from 'sequelize';
import QuestionBank, { IQuestionBank } from '../models/assessment/questionBank.model';
import { NotFoundError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';

export interface IViewQuestionsQuery {
    page?: number;
    size?: number;
    q?: string;
    categories?: string[];
}

export default class QuestionBankService {
    static async addQuestion(questionData: IQuestionBank): Promise<QuestionBank> {
        const question = await QuestionBank.create({ ...questionData });
        return question;
    }

    static async viewQuestions(queryData?: IViewQuestionsQuery): Promise<{ questions: QuestionBank[], count: number, totalPages?: number }> {
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

        const queryOptions: FindAndCountOptions<QuestionBank> = { where };

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

    static async viewSingleQuestion(id: string): Promise<QuestionBank> {
        const question: QuestionBank | null = await QuestionBank.findByPk(id);

        if (!question) {
            throw new NotFoundError('Question not found');
        }

        return question;
    }

    static async updateQuestion(id: string, dataToUpdate: Partial<IQuestionBank>): Promise<QuestionBank> {
        const question = await this.viewSingleQuestion(id);
        await question.update(dataToUpdate);
        return question;
    }

    static async deleteQuestion(id: string, transaction?: Transaction): Promise<void> {
        const question = await this.viewSingleQuestion(id);
        transaction ? await question.destroy({ transaction }) : await question.destroy();
    }
}