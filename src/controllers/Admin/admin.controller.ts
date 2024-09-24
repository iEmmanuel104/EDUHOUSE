import { Request, Response } from 'express';
import AdminService from '../../services/AdminServices/admin.service';
import { AdminAuthenticatedRequest } from '../../middlewares/authMiddleware';
import { BadRequestError, ForbiddenError } from '../../utils/customErrors';
import { AuthUtil } from '../../utils/token';
import { emailService, EmailTemplate } from '../../utils/Email';

export default class AdminController {

    static async loginSuperAdmin(req: Request, res: Response) {
        const { email } = req.body;

        const checkAdmin = await AdminService.getAdminByEmail(email);
        const firstName = checkAdmin.name.split(' ')[0];

        const otpCode = await AuthUtil.generateCode({ type: 'adminlogin', identifier: checkAdmin.email, expiry: 60 * 10 });

        const templateData = {
            otpCode,
            name: firstName,
        };

        // Send email with OTP
        await emailService.send({
            email: checkAdmin.email,
            from: 'auth',
            subject: 'Admin Login Verification',
            html: await new EmailTemplate().adminLogin({ otpCode, name: firstName }),
            isPostmarkTemplate: true,
            postMarkTemplateAlias: 'verify-email',
            postmarkInfo: [{
                postMarkTemplateData: templateData,
                receipientEmail: email,
            }],
        });

        res.status(200).json({
            status: 'success',
            message: 'Verification code sent to admin email',
        });
    }

    static async verifySuperAdminLogin(req: Request, res: Response) {
        const { email, otpCode } = req.body;

        const checkAdmin = await AdminService.getAdminByEmail(email);

        const validCode = await AuthUtil.compareAdminCode({ identifier: checkAdmin.email, tokenType: 'adminlogin', token: otpCode });
        if (!validCode) {
            throw new BadRequestError('Invalid verification code');
        }

        // Generate admin token
        const adminToken = await AuthUtil.generateAdminToken({ type: 'admin', identifier: checkAdmin.email });

        res.status(200).json({
            status: 'success',
            message: 'Admin login successful',
            data: { adminToken, admin: checkAdmin },
        });
    }

    static async createAdmin(req: AdminAuthenticatedRequest, res: Response) {
        const { name, email, isSuperAdmin } = req.body;

        if (req.admin.isSuperAdmin === false) {
            throw new ForbiddenError('Only super admin can create new admins');
        }

        const newAdmin = await AdminService.createAdmin({ name, email, isSuperAdmin });

        res.status(201).json({
            status: 'success',
            message: 'New admin created successfully',
            data: newAdmin,
        });
    }

    static async getAllAdmins(req: AdminAuthenticatedRequest, res: Response) {
        // Check if the requester is the super admin
        if (req.admin.isSuperAdmin === false) {
            throw new ForbiddenError('Only super admin can view all admins');
        }

        const admins = await AdminService.getAllAdmins();

        res.status(200).json({
            status: 'success',
            message: 'All admins retrieved successfully',
            data: admins,
        });
    }

    static async deleteAdmin(req: AdminAuthenticatedRequest, res: Response) {
        const { id } = req.query;

        if (req.admin.isSuperAdmin === false) {
            throw new ForbiddenError('Only super admin can delete admins');
        }

        // admin cannot delete self
        if (id === req.admin.id) {
            throw new ForbiddenError('You cannot delete yourself');
        }

        await AdminService.deleteAdmin(id as string);

        res.status(200).json({
            status: 'success',
            message: 'Admin deleted successfully',
            data: null,
        });
    }

}