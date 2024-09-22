import { Request, Response } from 'express';
import SchoolService, { IViewSchoolsQuery } from '../services/school.service';
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

        // const { firstName, lastName, otherName, displayImage, gender, isDeactivated } = req.body;

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
}