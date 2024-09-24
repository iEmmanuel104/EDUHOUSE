import { Op } from 'sequelize';
import Admin, { IAdmin } from '../../models/admin.model';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';
import { ADMIN_EMAIL } from '../../utils/constants';

export default class AdminService {

    static async createAdmin(adminData: IAdmin): Promise<Admin> {
        const existingAdmin = await Admin.findOne({ where: { email: adminData.email } });
        if (existingAdmin) {
            throw new BadRequestError('Admin with this email already exists');
        }

        const newAdmin = await Admin.create(adminData);
        return newAdmin;
    }

    static async getAllAdmins(): Promise<Admin[]> {
    // exclude the ADMIN_EMAIL from the list of admins
        return Admin.findAll({
            where: {
                email: {
                    [Op.ne]: ADMIN_EMAIL,
                },
            },
        });
    }

    static async getAdminByEmail(email: string): Promise<Admin> {   

        const admin: Admin | null = await Admin.findOne({ where: { email } });
    
        if (!admin) {
            throw new NotFoundError('Admin not found');
        }
    
        return admin;
    }

    static async deleteAdmin(adminId: string): Promise<void> {
        const admin = await Admin.findByPk(adminId);
        if (!admin) {
            throw new NotFoundError('Admin not found');
        }

        if (admin.email === ADMIN_EMAIL) {
            throw new BadRequestError('Cannot delete the super admin');
        }

        await admin.destroy();
    }
}