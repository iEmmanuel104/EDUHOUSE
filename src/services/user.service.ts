import { Transaction, Op, FindAndCountOptions } from 'sequelize';
import User, { IUser } from '../models/user.model';
import { NotFoundError, BadRequestError } from '../utils/customErrors';
import Validator from '../utils/validators';
import Pagination, { IPaging } from '../utils/pagination';
import { Sequelize } from '../models';
import UserSettings, { IUserSettings } from '../models/userSettings.model';
import SchoolTeacher, { ISchoolTeacher } from '../models/schoolTeacher.model';
import School from '../models/school.model';
import Admin from '../models/admin.model';
import SchoolService from './school.service';
import { SchoolAdminPermissions } from '../models/schoolAdmin.model';
export interface IViewUsersQuery {
    page?: number;
    size?: number;
    q?: string;
    isBlocked?: boolean;
    isDeactivated?: boolean;
    schoolId?: number;
}

export interface IDynamicQueryOptions {
    query: Record<string, string>;
    includes?: 'profile' | 'all';
    attributes?: string[];
}

export default class UserService {

    static async isEmailAndUsernameAvailable(email: string, username?: string): Promise<boolean> {
        const validEmail = Validator.isValidEmail(email);
        if (!validEmail) throw new BadRequestError('Invalid email');

        let whereCondition;

        // Construct where condition based on the presence of username
        if (username) {
            whereCondition = {
                [Op.or]: [
                    { email: email },
                ],
            };
        } else {
            whereCondition = { email: email };
        }

        // Find a user with the constructed where condition
        const existingUser: User | null = await User.findOne({
            where: whereCondition,
            attributes: ['email'],
        });

        // Check if any user was found
        if (existingUser) {
            if (existingUser.email === email) {
                throw new BadRequestError('Email already in use');
            }
        }

        return true;
    }

    static async isEmailExisting(email: string): Promise<User | null> {
        const validEmail = Validator.isValidEmail(email);
        if (!validEmail) throw new BadRequestError('Invalid email');

        // Find a user with the constructed where condition
        const existingUser: User | null = await User.findOne({
            where: { email },
            attributes: ['email', 'id'],
        });

        return existingUser;

    }

    static async addUser(userData: IUser): Promise<User> {

        const _transaction = await User.create({ ...userData });

        await UserSettings.create({
            userId: _transaction.id,
            joinDate: new Date().toISOString().split('T')[0], // yyyy-mm-dd format
        } as IUserSettings);

        return _transaction;
    }

    static async addOrUpdateUser(userData: IUser, schoolData?: Omit<ISchoolTeacher, 'teacherId'>): Promise<{ user: User; isNewUser: boolean }> {
        const existingUser = await this.isEmailExisting(userData.email);

        if (existingUser) {
            // If user exists, update their information
            const updatedUser = await this.updateUser(existingUser, userData);
            if (schoolData) {
                await this.addOrUpdateTeacherInSchool(schoolData.schoolId, existingUser.id, schoolData.isTeachingStaff, schoolData.isActive, schoolData.classAssigned);
            }
            return { user: updatedUser, isNewUser: false };
        } else {
            // If user doesn't exist, create a new user
            const newUser = await this.addUser(userData);
            if (schoolData) {
                await this.addOrUpdateTeacherInSchool(schoolData.schoolId, newUser.id, schoolData.isTeachingStaff, schoolData.isActive, schoolData.classAssigned);
            }
            return { user: newUser, isNewUser: true };
        }
    }

    static async viewUsers(queryData?: IViewUsersQuery): Promise<{ teachers: User[], count: number, totalPages?: number }> {
        const { page, size, q: query, isBlocked, isDeactivated, schoolId } = queryData || {};

        const where: Record<string | symbol, unknown> = {};
        const settingsWhere: Record<string, unknown> = {};
        const schoolTeacherWhere: Record<string, unknown> = {};

        if (query) {
            where[Op.or] = [
                { firstName: { [Op.iLike]: `%${query}%` } },
                { lastName: { [Op.iLike]: `%${query}%` } },
                { email: { [Op.iLike]: `%${query}%` } },
                Sequelize.where(Sequelize.fn('concat', Sequelize.col('User.firstName'), ' ', Sequelize.col('User.lastName')), { [Op.iLike]: `%${query}%` }),
            ];
        }

        if (isBlocked !== undefined) {
            settingsWhere.isBlocked = isBlocked;
        }

        if (isDeactivated !== undefined) {
            settingsWhere.isDeactivated = isDeactivated;
        }

        if (schoolId !== undefined) {
            schoolTeacherWhere.schoolId = schoolId;
        }

        const queryOptions: FindAndCountOptions<User> = {
            where,
            include: [
                {
                    model: UserSettings,
                    as: 'settings',
                    attributes: ['joinDate', 'isBlocked', 'isDeactivated', 'lastLogin', 'meta'],
                    where: settingsWhere,
                },
                {
                    model: School,
                    as: 'schools',
                    through: {
                        // model: SchoolTeacher,
                        // as: 'schoolTeacher',
                        attributes: ['isTeachingStaff', 'classAssigned', 'isActive'],
                        where: schoolTeacherWhere,
                    },
                    attributes: ['id', 'name'],
                },
            ],
        };

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows: teachers, count } = await User.findAndCountAll(queryOptions);

        // Calculate the total count
        const totalCount = count as number;

        if (page && size && teachers.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count: totalCount, limit: size } as IPaging);
            return { teachers, count: totalCount, ...totalPages };
        } else {
            return { teachers, count: totalCount };
        }
    }

    static async viewSingleUser(id: string): Promise<User> {
        const user: User | null = await User.scope('withSettings').findByPk(id);

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async viewSingleUserByEmail(email: string, transaction?: Transaction): Promise<User> {
        const user: User | null = await User.findOne({
            where: { email },
            attributes: ['id', 'firstName', 'status'],
            transaction,
        });

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async viewSingleUserDynamic(queryOptions: IDynamicQueryOptions): Promise<User> {
        const { query, attributes } = queryOptions;

        const user: User | null = await User.scope('withSettings').findOne({
            where: query,
            ...(attributes ? { attributes } : {}),
        });

        if (!user) {
            throw new NotFoundError('Oops User not found');
        }

        return user;
    }

    static async updateUser(user: User, dataToUpdate: Partial<IUser>): Promise<User> {
        await user.update(dataToUpdate);

        const updatedUser = await this.viewSingleUser(user.id);

        return updatedUser;
    }

    static async updateUserSettings(userId: string, dataToUpdate: Partial<IUserSettings>): Promise<UserSettings> {
        const userSettings = await UserSettings.findOne({ where: { userId } });
        if (!userSettings) {
            throw new NotFoundError('Oops User not found');
        }

        await userSettings.update(dataToUpdate);

        return userSettings;
    }

    static async deleteUser(user: User, transaction?: Transaction): Promise<void> {
        transaction ? await user.destroy({ transaction }) : await user.destroy();
    }

    static async addOrUpdateTeacherInSchool(
        schoolId: number,
        teacherId: string,
        isTeachingStaff: boolean,
        isActive: boolean,
        classAssigned?: string,
        user?: Admin
    ): Promise<SchoolTeacher> {
        if (user) {
            await SchoolService.viewSingleSchool(schoolId.toString(), user, SchoolAdminPermissions.CREATE_TEACHER);
        }
        const [schoolTeacher, created] = await SchoolTeacher.findOrCreate({
            where: { schoolId, teacherId },
            defaults: {
                schoolId,
                teacherId,
                isTeachingStaff,
                classAssigned,
                isActive,
            },
        });

        if (!created) {
            if (user) {
                await SchoolService.viewSingleSchool(schoolId.toString(), user, SchoolAdminPermissions.UPDATE_TEACHER);
            }
            await schoolTeacher.update({
                isTeachingStaff,
                classAssigned,
                isActive,
            });
        }

        return schoolTeacher;
    }

    static async addTeacherToSchool(schoolId: number, teacherId: string, isTeachingStaff: boolean, classAssigned?: string): Promise<SchoolTeacher> {
        const schoolTeacher = await SchoolTeacher.create({
            schoolId,
            teacherId,
            isTeachingStaff,
            classAssigned,
            isActive: true, // Set as active by default when adding a teacher
        });
        return schoolTeacher;
    }

    static async removeTeacherFromSchool(schoolId: string, teacherId: string, user?: Admin): Promise<void> {
        if (user) {
            await SchoolService.viewSingleSchool(schoolId, user, SchoolAdminPermissions.DELETE_TEACHER);
        }
        const schoolTeacher = await SchoolTeacher.findOne({ where: { schoolId, teacherId } });
        if (!schoolTeacher) {
            throw new NotFoundError('Teacher not found in this school');
        }
        await schoolTeacher.destroy();
    }

}