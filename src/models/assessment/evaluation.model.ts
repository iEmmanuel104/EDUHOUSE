import {
    Table, Column, Model, DataType, BelongsTo, ForeignKey,
    IsUUID, PrimaryKey, Default, BelongsToMany,
} from 'sequelize-typescript';
import School from '../school.model';
import Teacher, { ITeacher } from '../teacher.model';
import AssessmentTaker from './takers.model';
import AssessmentQuestion from './questions.model';
import QuestionBank, { IQuestionBank } from '../questionBank.model';

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
        schoolId: string;

    @BelongsTo(() => School)
        school: School;

    @Column({
        type: DataType.ENUM,
        values: ['all', 'teaching', 'non_teaching', 'specific'],
        allowNull: false,
        defaultValue: 'all',
    })
        targetAudience: 'all' | 'teaching' | 'non_teaching' | 'specific';

    @BelongsToMany(() => Teacher, {
        through: () => AssessmentTaker,
        foreignKey: 'assessmentId',
        otherKey: 'teacherId',
    })
        assignedTeachers: Teacher[];

    @BelongsToMany(() => QuestionBank, () => AssessmentQuestion)
        questions: QuestionBank[];
}

export interface IAssessment {
    id?: string;
    name: string;
    description?: string;
    categories: string[];
    schoolId: string;
    targetAudience: 'all' | 'teaching' | 'non_teaching' | 'specific';
    assignedTeachers?: ITeacher[];
    questions?: IQuestionBank[];
}