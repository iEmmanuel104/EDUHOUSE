import { Transaction, Op, FindAndCountOptions } from 'sequelize';
import Assessment, { AssessmentTargetAudience, IAssessment } from '../models/evaluation/assessment.model';
import AssessmentTaker, { IAssessmentTaker, AssessmentTakerStatus } from '../models/evaluation/takers.model';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/customErrors';
import Pagination, { IPaging } from '../utils/pagination';
import Admin from '../models/admin.model';
import SchoolAdmin, { SchoolAdminPermissions } from '../models/schoolAdmin.model';
import SchoolService from './school.service';
import SchoolTeacher from '../models/schoolTeacher.model';
import User from '../models/user.model';
import QuestionBank, { IQuestionBank } from '../models/evaluation/questionBank.model';
import AssessmentQuestion, { IAssessmentQuestion } from '../models/evaluation/questions.model';
import moment from 'moment';

export interface IViewAssessmentsQuery {
    page?: number;
    size?: number;
    q?: string;
    schoolId?: string;
    teacherId?: string;
    targetAudience?: AssessmentTargetAudience;
}

export interface IViewAssessmentTakersQuery {
    page?: number;
    size?: number;
    assessmentId?: string;
    teacherId?: string;
    status?: AssessmentTakerStatus;
}

export interface IViewQuestionsQuery {
    page?: number;
    size?: number;
    q?: string;
    categories?: string[];
}

export default class AssessmentService {
    static async addAssessment(assessmentData: IAssessment, user: Admin, permission: SchoolAdminPermissions): Promise<Assessment> {
        await SchoolService.viewSingleSchool((assessmentData.schoolId).toString(), user, permission);

        const assessment = await Assessment.create({
            ...assessmentData,
            grading: {
                isGradable: assessmentData.grading?.isGradable ?? true,
                passMark: assessmentData.grading?.passMark ?? 50,
            },
        });

        if (assessmentData.questions && assessmentData.questions.length > 0) {
            const assessmentQuestions = assessmentData.questions.map((question, index) => ({
                assessmentId: assessment.id,
                questionId: question.id,
                order: index + 1,
                isCustom: false,
            }));

            await AssessmentQuestion.bulkCreate(assessmentQuestions as IAssessmentQuestion[]);
        }

        // Automatically assign teachers based on target audience
        if (assessmentData.targetAudience !== AssessmentTargetAudience.SPECIFIC) {
            await this.assignTeachersToAssessment(assessment);
        }

        return assessment;
    }

    private static async assignTeachersToAssessment(assessment: Assessment): Promise<void> {
        const { schoolId, targetAudience } = assessment;

        const teacherQuery: { schoolId: number; isTeachingStaff?: boolean } = { schoolId };
        if (targetAudience === AssessmentTargetAudience.TEACHING) {
            teacherQuery.isTeachingStaff = true;
        } else if (targetAudience === AssessmentTargetAudience.NON_TEACHING) {
            teacherQuery.isTeachingStaff = false;
        }

        const schoolTeachers = await SchoolTeacher.findAll({
            where: teacherQuery,
            include: [{ model: User, as: 'teacher', attributes: ['id'] }],
        });

        const assessmentTakers = schoolTeachers.map(schoolTeacher => ({
            assessmentId: assessment.id,
            teacherId: schoolTeacher.teacher.id,
            status: AssessmentTakerStatus.PENDING,
        }));

        await AssessmentTaker.bulkCreate(assessmentTakers);
    }

    static async viewAssessments(queryData: IViewAssessmentsQuery, user: Admin | User): Promise<{ assessments: Assessment[], count: number, totalPages?: number }> {
        const { page, size, q: query, schoolId, targetAudience, teacherId } = queryData;

        const where: Record<string | symbol, unknown> = {};

        if (query) {
            where[Op.or] = [
                { name: { [Op.iLike]: `%${query}%` } },
                { description: { [Op.iLike]: `%${query}%` } },
            ];
        }

        if (schoolId) {
            where.schoolId = schoolId;
        }

        if (targetAudience) {
            where.targetAudience = targetAudience;
        }

        const queryOptions: FindAndCountOptions<Assessment> = {
            where,
            include: [{
                model: User,
                as: 'assignedUsers',
                attributes: ['id'],
                through: { attributes: [] },
            }],
        };

        if (user instanceof User || (user instanceof Admin && !user.isSuperAdmin)) {
            queryOptions.include = [{
                model: User,
                as: 'assignedUsers',
                where: { id: user.id },
                attributes: ['id'],
                through: { attributes: [] },
            }];
        } else if (user instanceof Admin && user.isSuperAdmin && teacherId) {
            queryOptions.include = [{
                model: User,
                as: 'assignedUsers',
                where: { id: teacherId },
                attributes: ['id'],
                through: { attributes: [] },
            }];
        }

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows: assessments, count } = await Assessment.findAndCountAll(queryOptions);

        if (page && size && assessments.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { assessments, count, ...totalPages };
        } else {
            return { assessments, count };
        }
    }

    static async viewSingleAssessment(id: string, admin?: Admin): Promise<Assessment> {
        const attributes: string[] = [
            'id', 'name', 'description', 'categories', 'schoolId', 'targetAudience',
            'startDate', 'duration', 'grading',
        ];

        let includeQuestions = false;

        if (admin) {
            if (admin.isSuperAdmin) {
                includeQuestions = true;
            } else {
                const schoolAdmin = await SchoolAdmin.findOne({
                    where: { adminId: admin.id, schoolId: id },
                });

                if (!schoolAdmin) {
                    throw new UnauthorizedError('You do not have permission to view this assessment');
                }

                const hasViewRestriction = schoolAdmin.restrictions.includes(SchoolAdminPermissions.VIEW_ASSESSMENT);
                const assessmentStartDate = await Assessment.findByPk(id, { attributes: ['startDate'] });

                if (!assessmentStartDate) {
                    throw new NotFoundError('Assessment not found');
                }

                const hasStarted = moment().isAfter(moment(assessmentStartDate.startDate));

                if (hasStarted || !hasViewRestriction) {
                    includeQuestions = true;
                }
            }
        }

        const assessment: Assessment | null = await Assessment.findByPk(id, {
            attributes,
            include: includeQuestions ? [
                {
                    model: QuestionBank,
                    through: { attributes: ['order', 'isCustom'] },
                },
            ] : [],
        });

        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        return assessment;
    }

    static async updateAssessment(id: string, dataToUpdate: Partial<IAssessment>, user: Admin, permission: SchoolAdminPermissions): Promise<Assessment> {
        const assessment = await this.viewSingleAssessment(id);
        await SchoolService.viewSingleSchool((assessment.schoolId).toString(), user, permission);
        await assessment.update(dataToUpdate);
        return assessment;
    }

    static async deleteAssessment(id: string, user: Admin, permission: SchoolAdminPermissions, transaction?: Transaction): Promise<void> {
        const assessment = await this.viewSingleAssessment(id);
        await SchoolService.viewSingleSchool((assessment.schoolId).toString(), user, permission);
        transaction ? await assessment.destroy({ transaction }) : await assessment.destroy();
    }

    static async gradeAssessment(assessmentId: string): Promise<{ gradedCount: number, totalCount: number }> {
        const assessment = await Assessment.findByPk(assessmentId, {
            include: [{ model: QuestionBank, as: 'questions' }],
        });

        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        if (!assessment.grading.isGradable) {
            throw new BadRequestError('This assessment is not gradable');
        }

        const assessmentTakers = await AssessmentTaker.findAll({
            where: {
                assessmentId,
                status: AssessmentTakerStatus.COMPLETED,
                results: null, // Only grade takers that haven't been graded yet
            },
        });

        let gradedCount = 0;

        for (const taker of assessmentTakers) {
            const results = this.calculateResults(taker.answers, assessment.questions, assessment.grading.passMark);
            await taker.update({
                results,
                // Keep the status as COMPLETED
            });
            gradedCount++;
        }

        return {
            gradedCount,
            totalCount: assessmentTakers.length,
        };
    }

    private static calculateResults(
        answers: { questionId: string; answer: string }[],
        questions: QuestionBank[],
        passMark: number
    ): IAssessmentTaker['results'] {
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        const totalQuestions = questions.length;

        for (const question of questions) {
            const userAnswer = answers.find(a => a.questionId === question.id);
            if (userAnswer) {
                if (userAnswer.answer === question.answer) {
                    correctAnswers++;
                } else {
                    incorrectAnswers++;
                }
            }
        }

        const unanswered = totalQuestions - (correctAnswers + incorrectAnswers);
        const score = (correctAnswers / totalQuestions) * 100;
        const passed = score >= (passMark || 50); // Use the provided passMark or default to 50%

        return {
            score,
            totalQuestions,
            correctAnswers,
            incorrectAnswers,
            unanswered,
            passed,
        };
    }

    // assessment taker
    static async addAssessmentTaker(takerData: IAssessmentTaker, user: Admin, permission: SchoolAdminPermissions): Promise<AssessmentTaker> {
        const assessment = await this.viewSingleAssessment(takerData.assessmentId);
        await SchoolService.viewSingleSchool((assessment.schoolId).toString(), user, permission);
        const taker = await AssessmentTaker.create({ ...takerData });
        return taker;
    }

    static async viewAssessmentTakers(queryData?: IViewAssessmentTakersQuery): Promise<{ takers: AssessmentTaker[], count: number, totalPages?: number }> {
        const { page, size, assessmentId, teacherId, status } = queryData || {};

        const where: Record<string | symbol, unknown> = {};

        if (assessmentId) {
            where.assessmentId = assessmentId;
        }

        if (teacherId) {
            where.teacherId = teacherId;
        }

        if (status) {
            where.status = status;
        }

        const queryOptions: FindAndCountOptions<AssessmentTaker> = { where };

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows: takers, count } = await AssessmentTaker.findAndCountAll(queryOptions);

        if (page && size && takers.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { takers, count, ...totalPages };
        } else {
            return { takers, count };
        }
    }

    static async viewSingleAssessmentTaker(id: string): Promise<AssessmentTaker> {
        const taker: AssessmentTaker | null = await AssessmentTaker.findByPk(id);

        if (!taker) {
            throw new NotFoundError('Assessment taker not found');
        }

        return taker;
    }

    static async updateAssessmentTaker(id: string, dataToUpdate: Partial<IAssessmentTaker>): Promise<AssessmentTaker> {
        const taker = await this.viewSingleAssessmentTaker(id);
        await taker.update(dataToUpdate);
        return taker;
    }

    static async deleteAssessmentTaker(id: string, user: Admin, permission: SchoolAdminPermissions, transaction?: Transaction): Promise<void> {
        const taker = await this.viewSingleAssessmentTaker(id);
        const assessment = await this.viewSingleAssessment(taker.assessmentId);
        await SchoolService.viewSingleSchool((assessment.schoolId).toString(), user, permission);
        transaction ? await taker.destroy({ transaction }) : await taker.destroy();
    }

    // assessment questions
    static async addOrUpdateAssessmentQuestion(
        assessmentId: string,
        questionData: IQuestionBank & { id?: string },
        user: Admin,
        permission: SchoolAdminPermissions,
        transaction?: Transaction
    ): Promise<{ question: QuestionBank; created: boolean }> {
        const assessment = await Assessment.findByPk(assessmentId, { transaction });
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        await SchoolService.viewSingleSchool(assessment.schoolId.toString(), user, permission);

        let question: QuestionBank;
        let created: boolean;

        if (questionData.id) {
            // Update existing question
            const existingQuestion = await QuestionBank.findByPk(questionData.id, { transaction });
            if (!existingQuestion) {
                throw new NotFoundError('Question not found');
            }
            await existingQuestion.update(questionData, { transaction });
            question = existingQuestion;
            created = false;
        } else {
            // Create new question
            question = await QuestionBank.create(questionData, { transaction });
            await AssessmentQuestion.create({
                assessmentId,
                questionId: question.id,
                order: (await AssessmentQuestion.count({ where: { assessmentId }, transaction })) + 1,
                isCustom: false,
            }, { transaction });
            created = true;
        }

        return { question, created };
    }

    static async removeQuestionFromAssessment(
        assessmentId: string,
        questionId: string,
        user: Admin,
        permission: SchoolAdminPermissions,
        transaction?: Transaction
    ): Promise<void> {
        const assessment = await Assessment.findByPk(assessmentId, { transaction });
        if (!assessment) {
            throw new NotFoundError('Assessment not found');
        }

        await SchoolService.viewSingleSchool(assessment.schoolId.toString(), user, permission);

        const assessmentQuestion = await AssessmentQuestion.findOne({
            where: { assessmentId, questionId },
            transaction,
        });

        if (!assessmentQuestion) {
            throw new NotFoundError('Question not found in this assessment');
        }

        await assessmentQuestion.destroy({ transaction });
    }

    static async viewAssessmentQuestions(
        assessmentId: string,
        queryData: IViewQuestionsQuery,
        teacherId?: string,
    ): Promise<{ questions: Partial<QuestionBank>[], count: number, totalPages?: number }> {
        const { page, size, q: query, categories } = queryData;

        const questionAttributes = ['id', 'question', 'options', 'categories'];

        const where: Record<string | symbol, unknown> = {
            assessmentId,
        };

        const questionWhere: Record<string | symbol, unknown> = {};

        if (query) {
            questionWhere.question = { [Op.iLike]: `%${query}%` };
        }

        if (categories && categories.length > 0) {
            questionWhere.categories = { [Op.overlap]: categories };
        }

        const queryOptions: FindAndCountOptions<AssessmentQuestion> = {
            where,
            include: [
                {
                    model: QuestionBank,
                    as: 'questions',
                    attributes: questionAttributes,
                    where: questionWhere,
                },
            ],
            order: [['order', 'ASC']],
        };

        if (teacherId) {
            queryOptions.include?.push({
                model: Assessment,
                include: [{
                    model: AssessmentTaker,
                    as: 'assignedUsers',
                    where: { teacherId },
                    required: true,
                }],
                required: true,
            });
        }

        if (page && size && page > 0 && size > 0) {
            const { limit, offset } = Pagination.getPagination({ page, size } as IPaging);
            queryOptions.limit = limit || 0;
            queryOptions.offset = offset || 0;
        }

        const { rows, count } = await AssessmentQuestion.findAndCountAll(queryOptions);

        if (teacherId && count === 0) {
            throw new UnauthorizedError('You are not assigned to this assessment');
        }

        const questions = rows.map(aq => aq.QuestionBank?.toJSON()).filter(Boolean) as Partial<QuestionBank>[];

        if (page && size && questions.length > 0) {
            const totalPages = Pagination.estimateTotalPage({ count, limit: size } as IPaging);
            return { questions, count, ...totalPages };
        } else {
            return { questions, count };
        }
    }

}