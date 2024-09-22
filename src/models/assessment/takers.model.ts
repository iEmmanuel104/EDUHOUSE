/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, ForeignKey, Default, IsUUID, PrimaryKey,
} from 'sequelize-typescript';
import Assessment from './evaluation.model';
import User from '../user.model';

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
        userId: string;

    @Column({
        type: DataType.ENUM,
        values: Object.values(AssessmentTakerStatus),
        defaultValue: AssessmentTakerStatus.PENDING,
    })
        status: AssessmentTakerStatus;

    @Column(DataType.DATE)
        dueDate: Date;

    @Column(DataType.DATE)
        startedAt: Date;

    @Column(DataType.DATE)
        completedAt: Date;

    @Column(DataType.JSONB)
        answers: { questionId: string; answer: string }[];

    @Column(DataType.FLOAT)
        score: number;
}

export interface IAssessmentTaker {
    id?: string;
    assessmentId: string;
    userId: string;
    status: AssessmentTakerStatus;
    dueDate: Date;
    startedAt: Date;
    completedAt: Date;
    answers: { questionId: string; answer: string }[];
    score: number;
}