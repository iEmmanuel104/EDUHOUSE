import { Transaction, FindAndCountOptions } from 'sequelize';
import SchoolAdmin, { ISchoolAdmin, AdminRole } from '../models/schoolAdmin.model';
import { NotFoundError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';

export interface IViewSchoolAdminsQuery {
    page?: number;
    size?: number;
    schoolId?: string;
    role?: AdminRole;
}

export default class SchoolAdminService {
    static async addSchoolAdmin(schoolAdminData: ISchoolAdmin): Promise<SchoolAdmin> {
        const schoolAdmin = await SchoolAdmin.create({ ...schoolAdminData });
        return schoolAdmin;
    }

    static async viewSchoolAdmins(queryData?: IViewSchoolAdminsQuery): Promise<{ schoolAdmins: SchoolAdmin[], count: number, totalPages?: number }> {
        const { page, size, schoolId, role } = queryData || {};

        const where: Record<string | symbol, unknown> = {};

        if (schoolId) {
            where.schoolId = schoolId;
        }

        if (role) {
            where.role = role;
        }

        const queryOptions: FindAndCountOptions<SchoolAdmin> = { where };

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows: schoolAdmins, count } = await SchoolAdmin.findAndCountAll(queryOptions);

        if (page && size && schoolAdmins.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { schoolAdmins, count, ...totalPages };
        } else {
            return { schoolAdmins, count };
        }
    }

    static async viewSingleSchoolAdmin(adminId: string, schoolId: string): Promise<SchoolAdmin> {
        const schoolAdmin: SchoolAdmin | null = await SchoolAdmin.findOne({
            where: { adminId, schoolId },
        });

        if (!schoolAdmin) {
            throw new NotFoundError('School Admin not found');
        }

        return schoolAdmin;
    }

    static async updateSchoolAdmin(userId: string, schoolId: string, dataToUpdate: Partial<ISchoolAdmin>): Promise<SchoolAdmin> {
        const schoolAdmin = await this.viewSingleSchoolAdmin(userId, schoolId);
        await schoolAdmin.update(dataToUpdate);
        return schoolAdmin;
    }

    static async deleteSchoolAdmin(userId: string, schoolId: string, transaction?: Transaction): Promise<void> {
        const schoolAdmin = await this.viewSingleSchoolAdmin(userId, schoolId);
        transaction ? await schoolAdmin.destroy({ transaction }) : await schoolAdmin.destroy();
    }
}