import { Request, Response } from 'express';
import SchoolService, { IViewSchoolsQuery, IViewSchoolAdminsQuery } from '../services/school.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export default class SchoolController {
    static async createSchool(req: AuthenticatedRequest, res: Response) {
        const schoolData = req.body;

        const newSchool = await SchoolService.addSchool(schoolData);

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

        const { schools, count, totalPages } = await SchoolService.viewSchools(queryData);

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
        const { id } = req.params;

        const school = await SchoolService.viewSingleSchool(id);

        res.status(200).json({
            status: 'success',
            message: 'School retrieved successfully',
            data: {
                school,
            },
        });
    }

    static async updateSchool(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        const updateData = req.body;

        //         // eslint-disable-next-line no-undef
        //         const file = req.file as Express.Multer.File | undefined;
        //         let url;
        //         if (file) {
        //             const result = await CloudinaryClientConfig.uploadtoCloudinary({
        //                 fileBuffer: file.buffer,
        //                 id: req.user.id,
        //                 name: file.originalname,
        //                 type: 'image',
        //             });
        //             url = result.url as string;
        //         } else if (displayImage) {
        //             url = displayImage;
        //         }


        const updatedSchool = await SchoolService.updateSchool(id, updateData);

        res.status(200).json({
            status: 'success',
            message: 'School updated successfully',
            data: {
                school: updatedSchool,
            },
        });
    }

    static async deleteSchool(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;

        await SchoolService.deleteSchool(id);

        res.status(200).json({
            status: 'success',
            message: 'School deleted successfully',
            data: null,
        });
    }

    static async addSchoolAdmin(req: AuthenticatedRequest, res: Response) {
        const schoolAdminData = req.body;

        const newSchoolAdmin = await SchoolService.addSchoolAdmin(schoolAdminData);

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

    static async getSchoolAdmin(req: Request, res: Response) {
        const { userId, schoolId } = req.params;

        const schoolAdmin = await SchoolService.viewSingleSchoolAdmin(userId, schoolId);

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

        const updatedSchoolAdmin = await SchoolService.updateSchoolAdmin(userId, schoolId, updateData);

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

        await SchoolService.deleteSchoolAdmin(userId, schoolId);

        res.status(200).json({
            status: 'success',
            message: 'School Admin deleted successfully',
            data: null,
        });
    }
}