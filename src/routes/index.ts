import { Router } from 'express';
import authRoute from './auth.routes';
import userRoute from './user.routes';
import AdminRoute from './Admin/admin.routes';


const router = Router();

router
    .use('/auth', authRoute)
    .use('/iamEduh', AdminRoute)
    .use('/user', userRoute);

export default router;


