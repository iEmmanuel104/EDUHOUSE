import { Request, Response } from 'express';
import { BadRequestError, ForbiddenError } from '../utils/customErrors';
import Password from '../models/password.model';
import { AuthUtil } from '../utils/token';
import { logger } from '../utils/logger';
import { Database } from '../models/index';
import { emailService, EmailTemplate } from '../utils/Email';
import UserService, { IDynamicQueryOptions } from '../services/user.service';
import { AdminAuthenticatedRequest, AuthenticatedRequest } from '../middlewares/authMiddleware';
import { Transaction } from 'sequelize';
import { ISchoolTeacher } from '../models/schoolTeacher.model';

export default class AuthController {

    static async signup(req: Request, res: Response) {
        const { email, firstName, lastName, schoolId, displayImage, gender, isTeachingStaff, classAssigned, phone } = req.body;

        const userData = {
            email,
            firstName,
            lastName,
            status: {
                activated: false,
                emailVerified: false,
            },
            displayImage,
            gender,
            phone: {
                countryCode: phone?.countryCode || '+234',
                number: phone?.number,
            },
        };

        const schoolData: Omit<ISchoolTeacher, 'teacherId'> | undefined = schoolId
            ? {
                schoolId,
                isTeachingStaff: isTeachingStaff || false,
                classAssigned,
                isActive: true, // or set this based on your logic
            }
            : undefined;

        const { user, isNewUser } = await UserService.addOrUpdateUser(userData, schoolData);

        if (!isNewUser) {
            // If the user already exists, update the message
            res.status(200).json({
                status: 'success',
                message: 'User updated successfully',
                data: {
                    user,
                },
            });
            return;
        }

        // Check if the request is made by an admin
        const isAdminRequest = req as AdminAuthenticatedRequest && (req as AdminAuthenticatedRequest).admin;

        if (isNewUser && isAdminRequest) {
            // If it's a new user and the request is made by an admin, create without sending OTP
            await user.update({
                status: { ...user.status, emailVerified: true, activated: true },
            });

            // password is the user's lastname in lowercase
            const password = user.lastName.toLowerCase();

            // Create a new password for the user
            await Password.create({ userId: user.id, password: password });

            res.status(201).json({
                status: 'success',
                message: 'User created successfully by admin',
                data: {
                    user,
                },
            });
            return;
        }

        const otpCode = await AuthUtil.generateCode({ type: 'emailverification', identifier: user.id, expiry: 60 * 10 });

        const templateData = {
            otpCode,
            name: firstName,
        };

        console.log('sending email');
        await emailService.send({
            email: 'batch',
            subject: 'Account Activation',
            from: 'auth',
            isPostmarkTemplate: true,
            postMarkTemplateAlias: 'verify-email',
            postmarkInfo: [{
                postMarkTemplateData: templateData,
                receipientEmail: email,
            }],
            html: await new EmailTemplate().accountActivation({ otpCode, name: firstName }),
        });

        res.status(201).json({
            status: 'success',
            message: 'Email verification code sent successfully',
            data: {
                user,
            },
        });
    }

    static async verifyEmail(req: Request, res: Response) {
        const { otpCode, email } = req.body;

        await Database.transaction(async (transaction: Transaction) => {

            const user = await UserService.viewSingleUserByEmail(email, transaction);

            if (user.status.emailVerified) throw new BadRequestError('Email already verified');

            const validCode = await AuthUtil.compareCode({ user, tokenType: 'emailverification', token: otpCode });
            if (!validCode) throw new BadRequestError('Invalid otp code');

            await user.update({
                status: { ...user.status, emailVerified: true, activated: true },
            }, { transaction });

            await AuthUtil.deleteToken({ user, tokenType: 'emailverification', tokenClass: 'code' });

            const updatedUser = await UserService.viewSingleUser(user.id);

            // password is the user's lastname in lowercase
            const password = user.lastName.toLowerCase();

            // Create a new password for the user
            await Password.create({ userId: user.id, password: password }, { transaction });

            const accessToken = await AuthUtil.generateToken({ type: 'access', user });
            const refreshToken = await AuthUtil.generateToken({ type: 'refresh', user });

            res.status(200).json({
                status: 'success',
                message: 'Email verified successfully',
                data: {
                    user: updatedUser,
                    accessToken,
                    refreshToken,
                },
            });
        });
    }

    static async resendVerificationEmail(req: Request, res: Response) {
        const email = req.query.email as string;

        const user = await UserService.viewSingleUserByEmail(email);

        if (user.status.emailVerified) {
            throw new BadRequestError('Email already verified');
        }

        const otpCode = await AuthUtil.generateCode({ type: 'emailverification', identifier: user.id, expiry: 60 * 10 });

        const templateData = {
            otpCode,
            name: user.firstName,
        };

        console.log('sending email');
        await emailService.send({
            email: 'batch',
            subject: 'Account Activation',
            from: 'auth',
            isPostmarkTemplate: true,
            postMarkTemplateAlias: 'verify-email',
            postmarkInfo: [{
                postMarkTemplateData: templateData,
                receipientEmail: email,
            }],
            html: await new EmailTemplate().accountActivation({ otpCode, name: user.firstName }),
        });
        res.status(200).json({
            status: 'success',
            message: 'Email verification code resent successfully',
            data: null,
        });
    }

    static async login(req: Request, res: Response) {
        const { password, registrationNumber, email } = req.body;
        let data;

        if (registrationNumber) {
            data = { registrationNumber };
        } else if (email) {
            data = { email };
        } else {
            throw new BadRequestError('Please provide either email or registration number');
        }
        logger.info('signing in with: ', data);

        const queryOptions: IDynamicQueryOptions = {
            query: data,
        };
        const user = await UserService.viewSingleUserDynamic(queryOptions);
        const userPassword = await user.$get('password');

        if (!user.status.emailVerified || !userPassword) {
            const otpCode = await AuthUtil.generateCode({ type: 'emailverification', identifier: user.id, expiry: 60 * 10 });
            // send email to user to verify email
            const templateData = {
                otpCode,
                name: user.firstName,
            };

            console.log('sending email');
            await emailService.send({
                email: 'batch',
                subject: 'Account Activation',
                from: 'auth',
                isPostmarkTemplate: true,
                postMarkTemplateAlias: 'verify-email',
                postmarkInfo: [{
                    postMarkTemplateData: templateData,
                    receipientEmail: user.email,
                }],
                html: await new EmailTemplate().accountActivation({ otpCode, name: user.firstName }),
            });
            throw new BadRequestError('An Email verification code has been sent to your email. Please verify your email');
        }

        const validPassword = await userPassword.isValidPassword(password.trim().toLowerCase());
        if (!validPassword) {
            throw new BadRequestError('Invalid credential combination');
        }

        if (user.settings.isBlocked) {
            throw new ForbiddenError('Oops! Your account has been blocked. Please contact support');
        }

        if (!user.status.activated) {
            await user.update({ status: { ...user.status, activated: true } });
        }

        const accessToken = await AuthUtil.generateToken({ type: 'access', user });
        const refreshToken = await AuthUtil.generateToken({ type: 'refresh', user });

        // // update the last Login for the user
        await UserService.updateUserSettings(user.id, { lastLogin: new Date() });

        res.status(200).json({
            status: 'success',
            message: 'Login successful',
            data: {
                user: user.dataValues,
                accessToken,
                refreshToken,
            },
        });
    }

    static async logout(req: AuthenticatedRequest, res: Response) {

        await AuthUtil.deleteToken({ user: req.user, tokenType: 'access', tokenClass: 'token' });
        await AuthUtil.deleteToken({ user: req.user, tokenType: 'refresh', tokenClass: 'token' });

        res.status(200).json({
            status: 'success',
            message: 'Logout successful',
            data: null,
        });
    }

    static async getLoggedUserData(req: AuthenticatedRequest, res: Response) {
        const user = req.user;

        res.status(200).json({
            status: 'success',
            message: 'user data retrieved successfully',
            data: {
                user: user.dataValues,
            },
        });
    }

}