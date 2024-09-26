/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, BelongsTo, ForeignKey,
    IsUUID, PrimaryKey, Default, BelongsToMany, Scopes,
} from 'sequelize-typescript';
import School from '../school.model';
import User, { IUser } from '../user.model';
import AssessmentTaker from './takers.model';
import AssessmentQuestion from './questions.model';
import QuestionBank, { IQuestionBank } from './questionBank.model';
import moment from 'moment-timezone';

export enum AssessmentTargetAudience {
    ALL = 'all',
    TEACHING = 'teaching',
    NON_TEACHING = 'non_teaching',
    SPECIFIC = 'specific',
}

export interface GradingSettings {
    isGradable: boolean;
    passMark: number;
}

@Scopes(() => ({
    School: (schoolId: number) => ({
        where: { schoolId },
    }),
}))

@Table
export default class Assessment extends Model<Assessment | IAssessment> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        name: string;

    @Column({
        type: DataType.TEXT,
    })
        description: string;

    @Column({
        type: DataType.ARRAY(DataType.STRING),
        allowNull: false,
    })
        categories: string[];

    @ForeignKey(() => School)
    @Column
        schoolId: number;

    @BelongsTo(() => School)
        school: School;

    @Column({
        type: DataType.ENUM,
        values: Object.values(AssessmentTargetAudience),
        allowNull: false,
        defaultValue: AssessmentTargetAudience.ALL,
    })
        targetAudience: AssessmentTargetAudience;

    @Column({
        type: DataType.DATE,
        allowNull: false,
        get() {
            return moment(this.getDataValue('startDate')).tz('Africa/Lagos').format('YYYY-MM-DDTHH:mm:ssZ');
        },
        set(value: Date | string) {
            this.setDataValue('startDate', moment(value).tz('Africa/Lagos').toDate());
        },
    })
        startDate: Date;

    @Column({
        type: DataType.INTEGER,
        allowNull: false,
        comment: 'Duration in minutes',
    })
        duration: number;

    @Column({
        type: DataType.JSONB,
        allowNull: false,
        defaultValue: {
            isGradable: true,
            passMark: 50,
        },
        validate: {
            isValidGradingSettings(value: GradingSettings) {
                if (typeof value.isGradable !== 'boolean') {
                    throw new Error('isGradable must be a boolean');
                }
                if (typeof value.passMark !== 'number' || value.passMark < 0 || value.passMark > 100) {
                    throw new Error('passMark must be a number between 0 and 100');
                }
            },
        },
    })
        grading: GradingSettings;

    @BelongsToMany(() => User, {
        through: () => AssessmentTaker,
        foreignKey: 'assessmentId',
        otherKey: 'teacherId',
    })
        assignedUsers: User[];

    @BelongsToMany(() => QuestionBank, () => AssessmentQuestion)
        questions: QuestionBank[];
}

export interface IAssessment {
    id?: string;
    name: string;
    description?: string;
    categories: string[];
    schoolId: number;
    targetAudience: AssessmentTargetAudience;
    startDate: Date | string;
    duration: number;
    grading: GradingSettings;
    assignedUsers?: IUser[];
    questions?: IQuestionBank[];
}