import { Request, Response } from 'express';
import TeacherService, { IViewTeachersQuery } from '../services/teacher.service';
import { AuthenticatedRequest } from '../middlewares/authMiddleware';

export default class TeacherController {
    static async createTeacher(req: AuthenticatedRequest, res: Response) {
        const teacherData = req.body;

        const newTeacher = await TeacherService.addTeacher(teacherData);

        res.status(201).json({
            status: 'success',
            message: 'Teacher created successfully',
            data: {
                teacher: newTeacher,
            },
        });
    }

    static async getTeachers(req: Request, res: Response) {
        const queryData: IViewTeachersQuery = req.query;

        const { teachers, count, totalPages } = await TeacherService.viewTeachers(queryData);

        res.status(200).json({
            status: 'success',
            message: 'Teachers retrieved successfully',
            data: {
                teachers,
                count,
                totalPages,
            },
        });
    }

    static async getTeacher(req: Request, res: Response) {
        const { id } = req.params;

        const teacher = await TeacherService.viewSingleTeacher(id);

        res.status(200).json({
            status: 'success',
            message: 'Teacher retrieved successfully',
            data: {
                teacher,
            },
        });
    }

    static async updateTeacher(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        const updateData = req.body;

        const updatedTeacher = await TeacherService.updateTeacher(id, updateData);

        res.status(200).json({
            status: 'success',
            message: 'Teacher updated successfully',
            data: {
                teacher: updatedTeacher,
            },
        });
    }

    static async deleteTeacher(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;

        await TeacherService.deleteTeacher(id);

        res.status(200).json({
            status: 'success',
            message: 'Teacher deleted successfully',
            data: null,
        });
    }
}