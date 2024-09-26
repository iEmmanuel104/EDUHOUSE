/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, ForeignKey, Default, IsUUID, PrimaryKey,
} from 'sequelize-typescript';
import Assessment from './assessment.model';
import User from '../user.model';
import moment from 'moment-timezone';

export enum AssessmentTakerStatus {
    PENDING = 'pending',
    ONGOING = 'ongoing',
    COMPLETED = 'completed',
}

@Table
export default class AssessmentTaker extends Model<AssessmentTaker | IAssessmentTaker> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

    @ForeignKey(() => Assessment)
    @Column
        assessmentId: string;

    @ForeignKey(() => User)
    @Column
        teacherId: string;

    @Column({
        type: DataType.ENUM,
        values: Object.values(AssessmentTakerStatus),
        defaultValue: AssessmentTakerStatus.PENDING,
    })
        status: AssessmentTakerStatus;

    @Column({
        type: DataType.DATE,
        get() {
            const date = this.getDataValue('startedAt');
            return date ? moment(date).tz('Africa/Lagos').format('YYYY-MM-DDTHH:mm:ssZ') : null;
        },
        set(value: Date | string) {
            this.setDataValue('startedAt', value ? moment(value).tz('Africa/Lagos').toDate() : null);
        },
    })
        startedAt: Date;

    @Column({
        type: DataType.DATE,
        get() {
            const date = this.getDataValue('completedAt');
            return date ? moment(date).tz('Africa/Lagos').format('YYYY-MM-DDTHH:mm:ssZ') : null;
        },
        set(value: Date | string) {
            this.setDataValue('completedAt', value ? moment(value).tz('Africa/Lagos').toDate() : null);
        },
    })
        completedAt: Date;

    @Column(DataType.JSONB)
        answers: { questionId: string; answer: string }[];

    @Column(DataType.JSONB)
        results: {
        score: number;
        totalQuestions: number;
        correctAnswers: number;
        incorrectAnswers: number;
        unanswered: number;
        passed: boolean;
    } | null;
}

export interface IAssessmentTaker {
    id?: string;
    assessmentId: string;
    teacherId: string;
    status: AssessmentTakerStatus;
    startedAt?: Date | string;
    completedAt?: Date | string;
    answers?: { questionId: string; answer: string }[];
    results?: {
        score: number;
        totalQuestions: number;
        correctAnswers: number;
        incorrectAnswers: number;
        unanswered: number;
        passed: boolean;
    };
}