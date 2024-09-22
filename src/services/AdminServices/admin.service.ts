import Admin, { IAdmin } from '../../models/admin.model';
import { BadRequestError, NotFoundError } from '../../utils/customErrors';

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
        return Admin.findAll();
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
        await admin.destroy();
    }
}