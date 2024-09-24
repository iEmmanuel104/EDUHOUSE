import { Transaction, Op, FindAndCountOptions, Sequelize } from 'sequelize';
import School, { ISchool } from '../models/school.model';
import SchoolAdmin, { ISchoolAdmin, AdminRole, SchoolAdminPermissions } from '../models/schoolAdmin.model';
import Admin from '../models/admin.model';
import { NotFoundError, UnauthorizedError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';
import Validator from '../utils/validators';
import User from '../models/user.model';

export interface IViewSchoolsQuery {
    page?: number;
    size?: number;
    q?: string;
    isActive?: boolean;
}

export interface IViewSchoolAdminsQuery {
    page?: number;
    size?: number;
    schoolId?: string;
    role?: AdminRole;
}

export default class SchoolService {
    static async addSchool(schoolData: ISchool, adminId: string): Promise<School> {
        const admin = await Admin.findByPk(adminId);
        if (!admin || !admin.isSuperAdmin) {
            throw new UnauthorizedError('Only superadmins can create schools');
        }

        const school = await School.create({ ...schoolData });

        // Add the superadmin as the school admin owner
        await SchoolAdmin.create({
            adminId: admin.id,
            schoolId: school.id,
            role: AdminRole.OWNER,
            restrictions: [],
        });

        return school;
    }

    static async viewSchools(
        queryData: IViewSchoolsQuery,
        user?: Admin | User
    ): Promise<{ schools: School[], count: number, totalPages?: number }> {
        const { page, size, q: query, isActive } = queryData;

        const where: Record<string | symbol, unknown> = {};

        if (query) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${query}%` } },
                { registrationId: { [Op.iLike]: `%${query}%` } },
                Sequelize.where(
                    Sequelize.fn('concat', 'EDH', Sequelize.literal('school_code + 1000')),
                    { [Op.iLike]: `%${query}%` }
                ),
                { schoolCode: isNaN(parseInt(query)) ? -1 : parseInt(query) },
            ];
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const queryOptions: FindAndCountOptions<School> = { where };

        // Filter schools based on user type and permissions
        if (user) {
            if (user instanceof Admin) {
                if (!user.isSuperAdmin) {
                    const adminSchools = await SchoolAdmin.findAll({ where: { adminId: user.id } });
                    const schoolIds = adminSchools.map(as => as.schoolId);
                    where.id = { [Op.in]: schoolIds };
                }
            } else if (user instanceof User) {
                // If it's a regular user, only return their school
                where.id = user.schoolId;
            }
        }

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

    static async viewSingleSchool(identifier: string): Promise<School> {
        let school: School | null = null;

        // Check if the identifier is a UUID
        if (Validator.isUUID(identifier)) {
            school = await School.findByPk(identifier);
        } else if (identifier.startsWith('EDH')) {
            // If it starts with 'EDH', assume it's a formatted school code
            const schoolId = await School.convertFormattedCodeToInteger(identifier);
            if (schoolId) {
                school = await School.findOne({ where: { schoolCode: schoolId } });
            }
        } else {
            // Otherwise, try to parse it as a school code number
            const schoolCode = parseInt(identifier, 10);
            if (!isNaN(schoolCode)) {
                school = await School.findOne({ where: { schoolCode } });
            }
        }

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

    static async addSchoolAdmin(schoolAdminData: ISchoolAdmin & { restrictions?: SchoolAdminPermissions[] }): Promise<SchoolAdmin> {
        const { restrictions, ...data } = schoolAdminData;
        const schoolAdmin = await SchoolAdmin.create({
            ...data,
            restrictions: restrictions || [],
        });
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