import { Transaction, Op, FindAndCountOptions } from 'sequelize';
import Teacher, { ITeacher } from '../models/teacher.model';
import { NotFoundError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';

export interface IViewTeachersQuery {
    page?: number;
    size?: number;
    q?: string;
    schoolId?: string;
    isTeachingStaff?: boolean;
}

export default class TeacherService {
    static async addTeacher(teacherData: ITeacher): Promise<Teacher> {
        const teacher = await Teacher.create({ ...teacherData });
        return teacher;
    }

    static async viewTeachers(queryData?: IViewTeachersQuery): Promise<{ teachers: Teacher[], count: number, totalPages?: number }> {
        const { page, size, q: query, schoolId, isTeachingStaff } = queryData || {};

        const where: Record<string | symbol, unknown> = {};

        if (query) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${query}%` } },
                { email: { [Op.iLike]: `%${query}%` } },
            ];
        }

        if (schoolId) {
            where.schoolId = schoolId;
        }

        if (isTeachingStaff !== undefined) {
            where.isTeachingStaff = isTeachingStaff;
        }

        const queryOptions: FindAndCountOptions<Teacher> = { where };

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows: teachers, count } = await Teacher.findAndCountAll(queryOptions);

        if (page && size && teachers.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { teachers, count, ...totalPages };
        } else {
            return { teachers, count };
        }
    }

    static async viewSingleTeacher(id: string): Promise<Teacher> {
        const teacher: Teacher | null = await Teacher.findByPk(id);

        if (!teacher) {
            throw new NotFoundError('Teacher not found');
        }

        return teacher;
    }

    static async updateTeacher(id: string, dataToUpdate: Partial<ITeacher>): Promise<Teacher> {
        const teacher = await this.viewSingleTeacher(id);
        await teacher.update(dataToUpdate);
        return teacher;
    }

    static async deleteTeacher(id: string, transaction?: Transaction): Promise<void> {
        const teacher = await this.viewSingleTeacher(id);
        transaction ? await teacher.destroy({ transaction }) : await teacher.destroy();
    }
}