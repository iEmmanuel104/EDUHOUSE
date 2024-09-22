import {
    Table, Column, Model, DataType, BelongsTo, ForeignKey, IsEmail, IsUUID, PrimaryKey, Default,
    BeforeCreate, BeforeUpdate, BelongsToMany,
} from 'sequelize-typescript';
import School from './school.model';
import Assessment from './assessment/evaluation.model';
import AssessmentTaker from './assessment/takers.model';

@Table
export default class Teacher extends Model<Teacher | ITeacher> {
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
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    })
        isTeachingStaff: boolean;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        classAssigned: string;

    @IsEmail
    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
        email: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
        phoneNumber: string;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
        imageUrl: string;

    @ForeignKey(() => School)
    @Column
        schoolId: string;

    @BelongsTo(() => School)
        school: School;

    @BeforeCreate
    @BeforeUpdate
    static beforeSaveHook(instance: Teacher) {
        instance.email = instance.email.trim().toLowerCase();
    }

    @BelongsToMany(() => Assessment, {
        through: () => AssessmentTaker,
        foreignKey: 'teacherId',
        otherKey: 'assessmentId',
    })
        assessments: Assessment[];
}

export interface ITeacher {
    id?: string;
    name: string;
    isTeachingStaff: boolean;
    classAssigned: string;
    email: string;
    phoneNumber: string;
    schoolId: string;
}