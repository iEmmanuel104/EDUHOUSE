import { Request, Response } from 'express';
import SchoolService, { IViewSchoolsQuery, IViewSchoolAdminsQuery } from '../services/school.service';
import { AdminAuthenticatedRequest, AuthenticatedRequest } from '../middlewares/authMiddleware';
import { BadRequestError } from '../utils/customErrors';
import CloudinaryClientConfig from '../clients/cloudinary.config';
import { ISchool } from '../models/school.model';
import { ISchoolAdmin } from '../models/schoolAdmin.model';
import HelperUtils from '../utils/helpers';

export default class SchoolController {
    static async createSchool(req: AdminAuthenticatedRequest, res: Response) {
        const { name, location, registrationId, isActive } = req.body;
        const adminId = req.admin.id;

        if (!name || !location || !registrationId) {
            throw new BadRequestError('Name, location, and registrationId are required');
        }

        const schoolData = { name, location, registrationId, isActive: isActive || false } as ISchool;

        const newSchool = await SchoolService.addSchool(schoolData, adminId);

        res.status(201).json({
            status: 'success',
            message: 'School created successfully',
            data: {
                school: newSchool,
            },
        });
    }

    static async getSchools(req: Request, res: Response) {
        const queryData: IViewSchoolsQuery = req.query;
        const admin = (req as AdminAuthenticatedRequest).admin;
        const user = (req as AuthenticatedRequest).user;

        // Add userId to queryData if it's a superadmin request
        if (admin && admin.isSuperAdmin && req.query.teacherId) {
            queryData.userId = req.query.teacherId as string;
        }

        const { schools, count, totalPages } = await SchoolService.viewSchools(queryData, admin || user);

        res.status(200).json({
            status: 'success',
            message: 'Schools retrieved successfully',
            data: {
                schools,
                count,
                totalPages,
            },
        });
    }

    static async getSchool(req: Request, res: Response) {
        const { id } = req.query;

        if (!id) {
            throw new BadRequestError('School ID is required');
        }

        const school = await SchoolService.viewSingleSchool(id as string);

        res.status(200).json({
            status: 'success',
            message: 'School retrieved successfully',
            data: {
                school,
            },
        });
    }

    static async updateSchool(req: Request, res: Response) {
        const { id } = req.query;
        const { name, location, registrationId, isActive } = req.body;

        if (!id) {
            throw new BadRequestError('School ID is required');
        }

        const updateData: Partial<ISchool> = {};
        if (name) updateData.name = name;
        if (location) updateData.location = location;

        let Admin = undefined;
        if (req as AdminAuthenticatedRequest && (req as AdminAuthenticatedRequest).admin) {
            if (registrationId) updateData.registrationId = registrationId;
            if (isActive !== undefined) updateData.isActive = isActive;
            Admin = (req as AdminAuthenticatedRequest).admin;
        }

        // Handle logo upload
        // eslint-disable-next-line no-undef
        const file = req.file as Express.Multer.File | undefined;
        if (file) {
            const identifier = HelperUtils.generateRandomString(6);
            const result = await CloudinaryClientConfig.uploadtoCloudinary({
                fileBuffer: file.buffer,
                id: identifier,
                name: file.originalname,
                type: 'image',
            });
            updateData.logo = result.url as string;
        } else if (req.body.logo) {
            updateData.logo = req.body.logo;
        }

        const updatedSchool = await SchoolService.updateSchool(id as string, updateData, Admin);

        res.status(200).json({
            status: 'success',
            message: 'School updated successfully',
            data: {
                school: updatedSchool,
            },
        });
    }

    static async deleteSchool(req: AdminAuthenticatedRequest, res: Response) {
        const { id } = req.query;

        if (!id) {
            throw new BadRequestError('School ID is required');
        }

        const Admin = (req as AdminAuthenticatedRequest).admin;

        await SchoolService.deleteSchool(id as string, Admin);

        res.status(200).json({
            status: 'success',
            message: 'School deleted successfully',
            data: null,
        });
    }

    static async addSchoolAdmin(req: AuthenticatedRequest, res: Response) {
        const { adminId, schoolId, role, restrictions } = req.body;

        if (!adminId || !schoolId || !role) {
            throw new BadRequestError('AdminId, schoolId, and role are required');
        }

        const schoolAdminData = { adminId, schoolId, role, restrictions };

        const newSchoolAdmin = await SchoolService.addSchoolAdmin(schoolAdminData);

        res.status(201).json({
            status: 'success',
            message: 'School Admin added successfully',
            data: {
                schoolAdmin: newSchoolAdmin,
            },
        });
    }

    static async getSchoolAdmins(req: AuthenticatedRequest, res: Response) {
        const queryData: IViewSchoolAdminsQuery = req.query;

        const { schoolAdmins, count, totalPages } = await SchoolService.viewSchoolAdmins(queryData);

        res.status(200).json({
            status: 'success',
            message: 'School Admins retrieved successfully',
            data: {
                schoolAdmins,
                count,
                totalPages,
            },
        });
    }

    static async getSchoolAdmin(req: AuthenticatedRequest, res: Response) {
        const { userId, schoolId } = req.query;

        if (!userId || !schoolId) {
            throw new BadRequestError('UserId and schoolId are required');
        }

        const schoolAdmin = await SchoolService.viewSingleSchoolAdmin(userId as string, schoolId as string);

        res.status(200).json({
            status: 'success',
            message: 'School Admin retrieved successfully',
            data: {
                schoolAdmin,
            },
        });
    }

    static async updateSchoolAdmin(req: AuthenticatedRequest, res: Response) {
        const { userId, schoolId } = req.query;
        const { role, restrictions } = req.body;

        if (!userId || !schoolId) {
            throw new BadRequestError('UserId and schoolId are required');
        }

        const updateData: Partial<ISchoolAdmin> = {};
        if (role) updateData.role = role;
        if (restrictions) updateData.restrictions = restrictions;

        const updatedSchoolAdmin = await SchoolService.updateSchoolAdmin(userId as string, schoolId as string, updateData);

        res.status(200).json({
            status: 'success',
            message: 'School Admin updated successfully',
            data: {
                schoolAdmin: updatedSchoolAdmin,
            },
        });
    }

    static async deleteSchoolAdmin(req: AuthenticatedRequest, res: Response) {
        const { userId, schoolId } = req.query;

        if (!userId || !schoolId) {
            throw new BadRequestError('UserId and schoolId are required');
        }

        await SchoolService.deleteSchoolAdmin(userId as string, schoolId as string);

        res.status(200).json({
            status: 'success',
            message: 'School Admin deleted successfully',
            data: null,
        });
    }
}