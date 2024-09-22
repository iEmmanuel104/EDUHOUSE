import { Request, Response } from 'express';
import AdminService from '../../services/AdminServices/admin.service';
import { AdminAuthenticatedRequest } from '../../middlewares/authMiddleware';
import { BadRequestError, ForbiddenError } from '../../utils/customErrors';
import { ADMIN_EMAIL } from '../../utils/constants';
import { AuthUtil } from '../../utils/token';
import { emailService, EmailTemplate } from '../../utils/Email';

export default class AdminController {

    static async loginSuperAdmin(req: Request, res: Response) {
        const { email } = req.body;

        let emailToUse = email.toLowerCase().trim();
        let firstName = 'Owner';
        if (email !== ADMIN_EMAIL) {
            const checkAdmin = await AdminService.getAdminByEmail(email);
            emailToUse = checkAdmin.email;
            firstName = checkAdmin.name.split(' ')[0];
        }

        const otpCode = await AuthUtil.generateCode({ type: 'adminlogin', identifier: emailToUse, expiry: 60 * 10 });

        const templateData = {
            otpCode,
            name: firstName,
        };
        
        // Send email with OTP
        await emailService.send({
            email: emailToUse,
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

        let emailToUse = email.toLowerCase().trim();
        let adminData = { email: emailToUse, name: 'Owner', isSuperAdmin: true };
        if (email !== ADMIN_EMAIL) {
            const checkAdmin = await AdminService.getAdminByEmail(email);
            emailToUse = checkAdmin.email;
            adminData = checkAdmin;
        }

        const validCode = await AuthUtil.compareAdminCode({ identifier: emailToUse, tokenType: 'adminlogin', token: otpCode });
        if (!validCode) {
            throw new BadRequestError('Invalid verification code');
        }

        // Generate admin token
        const adminToken = await AuthUtil.generateAdminToken({ type: 'admin', identifier: emailToUse });

        res.status(200).json({
            status: 'success',
            message: 'Admin login successful',
            data: { adminToken, admin: adminData },
        });
    }

    static async createAdmin(req: AdminAuthenticatedRequest, res: Response) {
        const { name, email, isSuperAdmin } = req.body;

        if (req.isSuperAdmin === false) {
            throw new ForbiddenError('Only super admin can create new admins');
        }

        if (email === ADMIN_EMAIL) {
            throw new BadRequestError('Admin with this email already exists');
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
        if (req.isSuperAdmin === false) {
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

        if (req.isSuperAdmin === false) {
            throw new ForbiddenError('Only super admin can delete admins');
        }

        await AdminService.deleteAdmin(id as string);

        res.status(200).json({
            status: 'success',
            message: 'Admin deleted successfully',
            data: null,
        });
    }

}