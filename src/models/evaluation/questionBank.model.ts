import {
    Table, Column, Model, DataType, IsUUID, PrimaryKey, Default, Validate, BelongsToMany,
} from 'sequelize-typescript';
import Assessment, { IAssessment } from './assessment.model';
import AssessmentQuestion from './questions.model';

@Table
export default class QuestionBank extends Model<QuestionBank | IQuestionBank> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
    id: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    question: string;

    @Validate({
        isValidLength(value: { option: string; text: string }[]) {
            if (value.length < 2 || value.length > 4) {
                throw new Error('Options must contain between 2 and 4 entries.');
            }
        },
    })
    @Column(DataType.JSONB)
    options: { option: string; text: string }[];

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
    answer: string;

    @Column({
        type: DataType.ARRAY(DataType.STRING),
        allowNull: false,
    })
    categories: string[];

    @BelongsToMany(() => Assessment, () => AssessmentQuestion)
    assessments: Assessment[];
}


export interface IQuestionBank {
    id?: string;
    question: string;
    options: { option: string; text: string }[];
    answer: string;
    categories: string[];
    assessments?: IAssessment[];
}

