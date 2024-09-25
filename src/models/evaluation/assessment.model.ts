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

export enum AssessmentTargetAudience {
    ALL = 'all',
    TEACHING = 'teaching',
    NON_TEACHING = 'non_teaching',
    SPECIFIC = 'specific',
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
    assignedUsers?: IUser[];
    questions?: IQuestionBank[];
}