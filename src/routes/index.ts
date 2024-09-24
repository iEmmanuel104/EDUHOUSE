import { Router } from 'express';
import authRoute from './auth.routes';
import userRoute from './user.routes';
import AdminRoute from './Admin/admin.routes';
import SchoolRoute from './school.routes';

const router = Router();

router
    .use('/auth', authRoute)
    .use('/iamEduh', AdminRoute)
    .use('/school', SchoolRoute)
    .use('/user', userRoute);

export default router;


