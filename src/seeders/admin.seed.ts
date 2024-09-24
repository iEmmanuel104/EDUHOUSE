import Admin from '../models/admin.model';
import { ADMIN_EMAIL } from '../utils/constants';

export async function seedDefaultAdmin() {
    const defaultAdmin = await Admin.findOne({ where: { email: ADMIN_EMAIL } });
    if (!defaultAdmin) {
        await Admin.create({
            name: 'Edu-House Admin',
            email: ADMIN_EMAIL,
            isSuperAdmin: true,
        });
    }
}
