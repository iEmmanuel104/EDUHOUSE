import { Transaction, Op, FindAndCountOptions } from 'sequelize';
import Assessment, { AssessmentTargetAudience, IAssessment } from '../models/evaluation/assessment.model';
import AssessmentTaker, { IAssessmentTaker, AssessmentTakerStatus } from '../models/evaluation/takers.model';
import { NotFoundError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';

export interface IViewAssessmentsQuery {
    page?: number;
    size?: number;
    q?: string;
    schoolId?: string;
    targetAudience?: AssessmentTargetAudience;
}

export interface IViewAssessmentTakersQuery {
    page?: number;
    size?: number;
    assessmentId?: string;
    userId?: string;
    status?: AssessmentTakerStatus;
}

export default class AssessmentService {
    static async addAssessment(assessmentData: IAssessment): Promise<Assessment> {
        const assessment = await Assessment.create({ ...assessmentData });
        return assessment;
    }

    static async viewAssessments(queryData?: IViewAssessmentsQuery): Promise<{ assessments: Assessment[], count: number, totalPages?: number }> {
        const { page, size, q: query, schoolId, targetAudience } = queryData || {};

        const where: Record<string | symbol, unknown> = {};

        if (query) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${query}%` } },
                { description: { [Op.iLike]: `%${query}%` } },
            ];
        }

        if (schoolId) {
            where.schoolId = schoolId;
        }

        if (targetAudience) {
            where.targetAudience = targetAudience;
        }

        const queryOptions: FindAndCountOptions<Assessment> = { where };

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows: assessments, count } = await Assessment.findAndCountAll(queryOptions);

        if (page && size && assessments.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { assessments, count, ...totalPages };
        } else {
            return { assessments, count };
        }
    }

    static async viewSingleAssessment(id: string): Promise<Assessment> {
        const assessment: Assessment | null = await Assessment.findByPk(id);

        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        return assessment;
    }

    static async updateAssessment(id: string, dataToUpdate: Partial<IAssessment>): Promise<Assessment> {
        const assessment = await this.viewSingleAssessment(id);
        await assessment.update(dataToUpdate);
        return assessment;
    }

    static async deleteAssessment(id: string, transaction?: Transaction): Promise<void> {
        const assessment = await this.viewSingleAssessment(id);
        transaction ? await assessment.destroy({ transaction }) : await assessment.destroy();
    }


    // assess,emt taker

    static async addAssessmentTaker(takerData: IAssessmentTaker): Promise<AssessmentTaker> {
        const taker = await AssessmentTaker.create({ ...takerData });
        return taker;
    }

    static async viewAssessmentTakers(queryData?: IViewAssessmentTakersQuery): Promise<{ takers: AssessmentTaker[], count: number, totalPages?: number }> {
        const { page, size, assessmentId, userId, status } = queryData || {};

        const where: Record<string | symbol, unknown> = {};

        if (assessmentId) {
            where.assessmentId = assessmentId;
        }

        if (userId) {
            where.userId = userId;
        }

        if (status) {
            where.status = status;
        }

        const queryOptions: FindAndCountOptions<AssessmentTaker> = { where };

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows: takers, count } = await AssessmentTaker.findAndCountAll(queryOptions);

        if (page && size && takers.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { takers, count, ...totalPages };
        } else {
            return { takers, count };
        }
    }

    static async viewSingleAssessmentTaker(id: string): Promise<AssessmentTaker> {
        const taker: AssessmentTaker | null = await AssessmentTaker.findByPk(id);

        if (!taker) {
            throw new NotFoundError('Assessment taker not found');
        }

        return taker;
    }

    static async updateAssessmentTaker(id: string, dataToUpdate: Partial<IAssessmentTaker>): Promise<AssessmentTaker> {
        const taker = await this.viewSingleAssessmentTaker(id);
        await taker.update(dataToUpdate);
        return taker;
    }

    static async deleteAssessmentTaker(id: string, transaction?: Transaction): Promise<void> {
        const taker = await this.viewSingleAssessmentTaker(id);
        transaction ? await taker.destroy({ transaction }) : await taker.destroy();
    }
}