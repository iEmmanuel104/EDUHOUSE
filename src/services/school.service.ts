import { Transaction, Op, FindAndCountOptions } from 'sequelize';
import School, { ISchool } from '../models/school.model';
import { NotFoundError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';

export interface IViewSchoolsQuery {
    page?: number;
    size?: number;
    q?: string;
    isActive?: boolean;
}

export default class SchoolService {
    static async addSchool(schoolData: ISchool): Promise<School> {
        const school = await School.create({ ...schoolData });
        return school;
    }

    static async viewSchools(queryData?: IViewSchoolsQuery): Promise<{ schools: School[], count: number, totalPages?: number }> {
        const { page, size, q: query, isActive } = queryData || {};

        const where: Record<string | symbol, unknown> = {};

        if (query) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${query}%` } },
                { registrationId: { [Op.iLike]: `%${query}%` } },
            ];
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const queryOptions: FindAndCountOptions<School> = { where };

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows: schools, count } = await School.findAndCountAll(queryOptions);

        if (page && size && schools.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { schools, count, ...totalPages };
        } else {
            return { schools, count };
        }
    }

    static async viewSingleSchool(id: string): Promise<School> {
        const school: School | null = await School.findByPk(id);

        if (!school) {
            throw new NotFoundError('School not found');
        }

        return school;
    }

    static async updateSchool(id: string, dataToUpdate: Partial<ISchool>): Promise<School> {
        const school = await this.viewSingleSchool(id);
        await school.update(dataToUpdate);
        return school;
    }

    static async deleteSchool(id: string, transaction?: Transaction): Promise<void> {
        const school = await this.viewSingleSchool(id);
        transaction ? await school.destroy({ transaction }) : await school.destroy();
    }
}