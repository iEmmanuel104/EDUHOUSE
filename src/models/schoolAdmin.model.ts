/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, ForeignKey, BelongsTo,
} from 'sequelize-typescript';
import School from './school.model';
import User from './user.model';

export enum UserRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    GUEST = 'guest',
}

@Table
export default class SchoolAdmin extends Model<SchoolAdmin | ISchoolAdmin> {
    @ForeignKey(() => User)
    @Column
        userId: string;

    @ForeignKey(() => School)
    @Column
        schoolId: string;
    
    @Column({
        type: DataType.ENUM,
        values: Object.values(UserRole),
        allowNull: false,
        defaultValue: UserRole.GUEST,
    })
        role: UserRole;

    @BelongsTo(() => User)
        user: User;

    @BelongsTo(() => School)
        school: School;
}

export interface ISchoolAdmin {
    userId: string;
    schoolId: string;
    role: UserRole;
}
