import {
    Table, Column, Model, DataType, ForeignKey, Default, IsUUID, PrimaryKey,
} from 'sequelize-typescript';
import Assessment from './evaluation.model';
import QuestionBank from '../questionBank.model';

@Table
export default class AssessmentQuestion extends Model<AssessmentQuestion | IAssessmentQuestion> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;
    
    @ForeignKey(() => Assessment)
    @Column
        assessmentId: string;

    @ForeignKey(() => QuestionBank)
    @Column
        questionId: string;

    @Column(DataType.INTEGER)
        order: number;

    @Column(DataType.BOOLEAN)
        isCustom: boolean;
}

export interface IAssessmentQuestion {
    id?: string;
    assessmentId: string;
    questionId: string;
    order: number;
    isCustom: boolean;
}