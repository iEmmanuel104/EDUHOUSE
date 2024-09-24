import { ForeignKey, BelongsTo, DataType, Column, Model, Table } from 'sequelize-typescript';
import User from './user.model';
import School from './school.model';

@Table
export default class SchoolTeacher extends Model<SchoolTeacher> {
    @ForeignKey(() => School)
    @Column(DataType.INTEGER)
        schoolId: number;

    @ForeignKey(() => User)
    @Column(DataType.UUID)
        teacherId: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    })
        isTeachingStaff: boolean;
    
    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: true,
    })
        isActive: boolean;

    @Column({
        type: DataType.STRING,
        allowNull: true,
    })
        classAssigned: string;

    @BelongsTo(() => School)
        school: School;

    @BelongsTo(() => User)
        teacher: User;
}

export interface ISchoolTeacher {
    schoolId: number;
    teacherId: string;
    isTeachingStaff: boolean;
    isActive: boolean;
    classAssigned?: string;
}