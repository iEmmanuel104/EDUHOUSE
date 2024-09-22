import { Request, Response } from 'express';
import SchoolAdminService, { IViewSchoolAdminsQuery } from '../services/schoolAdmin.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export default class SchoolAdminController {
    static async addSchoolAdmin(req: AuthenticatedRequest, res: Response) {
        const schoolAdminData = req.body;

        const newSchoolAdmin = await SchoolAdminService.addSchoolAdmin(schoolAdminData);

        res.status(201).json({
            status: 'success',
            message: 'School Admin added successfully',
            data: {
                schoolAdmin: newSchoolAdmin,
            },
        });
    }

    static async getSchoolAdmins(req: Request, res: Response) {
        const queryData: IViewSchoolAdminsQuery = req.query;

        const { schoolAdmins, count, totalPages } = await SchoolAdminService.viewSchoolAdmins(queryData);

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

    static async getSchoolAdmin(req: Request, res: Response) {
        const { userId, schoolId } = req.params;

        const schoolAdmin = await SchoolAdminService.viewSingleSchoolAdmin(userId, schoolId);

        res.status(200).json({
            status: 'success',
            message: 'School Admin retrieved successfully',
            data: {
                schoolAdmin,
            },
        });
    }

    static async updateSchoolAdmin(req: AuthenticatedRequest, res: Response) {
        const { userId, schoolId } = req.params;
        const updateData = req.body;

        const updatedSchoolAdmin = await SchoolAdminService.updateSchoolAdmin(userId, schoolId, updateData);

        res.status(200).json({
            status: 'success',
            message: 'School Admin updated successfully',
            data: {
                schoolAdmin: updatedSchoolAdmin,
            },
        });
    }

    static async deleteSchoolAdmin(req: AuthenticatedRequest, res: Response) {
        const { userId, schoolId } = req.params;

        await SchoolAdminService.deleteSchoolAdmin(userId, schoolId);

        res.status(200).json({
            status: 'success',
            message: 'School Admin deleted successfully',
            data: null,
        });
    }
}