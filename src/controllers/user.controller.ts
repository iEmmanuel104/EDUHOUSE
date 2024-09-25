import { Request, Response } from 'express';
import UserService from '../services/user.service';
import { BadRequestError } from '../utils/customErrors';
import { AdminAuthenticatedRequest, AuthenticatedRequest } from '../middlewares/authMiddleware';
import CloudinaryClientConfig from '../clients/cloudinary.config';
import SchoolTeacher from '../models/schoolTeacher.model';

export default class UserController {

    static async getAllUsers(req: AdminAuthenticatedRequest, res: Response) {
        const { page, size, q, isBlocked, isDeactivated, schoolId } = req.query;
        const queryParams: Record<string, unknown> = {};

        if (page && size) {
            queryParams.page = Number(page);
            queryParams.size = Number(size);
        }

        if (isBlocked !== undefined) {
            queryParams.isBlocked = isBlocked === 'true';
        }

        if (isDeactivated !== undefined) {
            queryParams.isDeactivated = isDeactivated === 'true';
        }

        if (q) {
            queryParams.q = q as string;
        }

        if (schoolId) {
            queryParams.schoolId = Number(schoolId);
        }

        const users = await UserService.viewUsers(queryParams);
        res.status(200).json({
            status: 'success',
            message: 'Users retrieved successfully',
            data: { ...users },
        });
    }

    static async getUser(req: Request, res: Response) {
        const { id } = req.query;

        const user = await UserService.viewSingleUser(id as string);

        res.status(200).json({
            status: 'success',
            message: 'User retrieved successfully',
            data: user,
        });
    }

    static async updateUser(req: AuthenticatedRequest, res: Response) {
        const { firstName, lastName, otherName, displayImage, gender, isDeactivated } = req.body;

        // eslint-disable-next-line no-undef
        const file = req.file as Express.Multer.File | undefined;
        let url;
        if (file) {
            const result = await CloudinaryClientConfig.uploadtoCloudinary({
                fileBuffer: file.buffer,
                id: req.user.id,
                name: file.originalname,
                type: 'image',
            });
            url = result.url as string;
        } else if (displayImage) {
            url = displayImage;
        }

        // Prepare the update data for the user profile
        const updateData = {
            ...(firstName && { firstName }),
            ...(lastName && { lastName }),
            ...(otherName && { otherName }),
            ...(gender && { gender }),
            ...(url && { displayImage: url }),
        };

        // Only update settings if isDeactivated is provided in the request body
        let settingsData = {};
        if (isDeactivated !== undefined && isDeactivated === 'true') {
            const state: boolean = isDeactivated === 'true';
            settingsData = {
                ...(state === req.user.settings.isDeactivated ? {} : { isDeactivated: state }),
            };
        }

        const dataKeys = Object.keys(updateData);
        const settingsKeys = Object.keys(settingsData);

        if (dataKeys.length === 0 && settingsKeys.length === 0) {
            throw new BadRequestError('No new data to update');
        }

        // Update user settings if necessary
        if (settingsKeys.length > 0) {
            await UserService.updateUserSettings(req.user.id, settingsData);
        }

        // Update user profile data if necessary
        const updatedUser = dataKeys.length > 0
            ? await UserService.updateUser(req.user, updateData)
            : req.user;

        res.status(200).json({
            status: 'success',
            message: 'User updated successfully',
            data: updatedUser,
        });
    }


    static async addTeacherToSchool(req: AuthenticatedRequest, res: Response) {
        const { schoolId, teacherId, isTeachingStaff, classAssigned } = req.body;

        if (!schoolId || !teacherId) {
            throw new BadRequestError('SchoolId and teacherId are required');
        }

        const newSchoolTeacher = await UserService.addTeacherToSchool(schoolId, teacherId, isTeachingStaff, classAssigned);

        res.status(201).json({
            status: 'success',
            message: 'Teacher added to school successfully',
            data: {
                schoolTeacher: newSchoolTeacher,
            },
        });
    }

    static async updateTeacherInSchool(req: AuthenticatedRequest, res: Response) {
        const { schoolId, teacherId } = req.query;
        const { isTeachingStaff, classAssigned, isActive } = req.body;

        if (!schoolId || !teacherId) {
            throw new BadRequestError('SchoolId and teacherId are required');
        }

        const updateData: Partial<SchoolTeacher> = {};
        if (isTeachingStaff !== undefined) updateData.isTeachingStaff = isTeachingStaff;
        if (classAssigned !== undefined) updateData.classAssigned = classAssigned;
        if (isActive !== undefined) updateData.isActive = isActive;

        const updatedSchoolTeacher = await UserService.updateTeacherInSchool(schoolId as string, teacherId as string, updateData);

        res.status(200).json({
            status: 'success',
            message: 'Teacher in school updated successfully',
            data: {
                schoolTeacher: updatedSchoolTeacher,
            },
        });
    }

    static async removeTeacherFromSchool(req: AuthenticatedRequest, res: Response) {
        const { schoolId, teacherId } = req.query;

        if (!schoolId || !teacherId) {
            throw new BadRequestError('SchoolId and teacherId are required');
        }

        await UserService.removeTeacherFromSchool(schoolId as string, teacherId as string);

        res.status(200).json({
            status: 'success',
            message: 'Teacher removed from school successfully',
            data: null,
        });
    }
}
