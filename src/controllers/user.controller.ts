import { Request, Response } from 'express';
import UserService from '../services/user.service';
import { BadRequestError } from '../utils/customErrors';
import { AdminAuthenticatedRequest, AuthenticatedRequest } from '../middlewares/authMiddleware';
import CloudinaryClientConfig from '../clients/cloudinary.config';

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

        // Handle schoolId based on admin type
        if (req.admin.isSuperAdmin) {
            if (schoolId) {
                queryParams.schoolId = Number(schoolId);
            }
        } else {
            if (!schoolId) {
                throw new BadRequestError('SchoolId is required for non-super admins');
            }
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

        if (!id) {
            throw new BadRequestError('Teacher ID is required');
        }

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

    static async removeTeacherFromSchool(req: AdminAuthenticatedRequest, res: Response) {
        const { schoolId, teacherId } = req.query;

        if (!schoolId || !teacherId) {
            throw new BadRequestError('SchoolId and teacherId are required');
        }

        const admin = (req as AdminAuthenticatedRequest).admin;

        await UserService.removeTeacherFromSchool(schoolId as string, teacherId as string, admin);

        res.status(200).json({
            status: 'success',
            message: 'Teacher removed from school successfully',
            data: null,
        });
    }
}
