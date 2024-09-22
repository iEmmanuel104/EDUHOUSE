/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, ForeignKey, BelongsTo, Scopes,
} from 'sequelize-typescript';
import School from './school.model';
import Admin from './admin.model';

export enum AdminRole {
    OWNER = 'owner',
    ADMIN = 'admin',
    GUEST = 'guest',
}

@Scopes(() => ({
    School: (schoolId: number) => ({
        where: { schoolId },
    }),
}))

@Table
export default class SchoolAdmin extends Model<SchoolAdmin | ISchoolAdmin> {
    @ForeignKey(() => Admin)
    @Column
        adminId: string;

    @ForeignKey(() => School)
    @Column
        schoolId: number;
    
    @Column({
        type: DataType.ENUM,
        values: Object.values(AdminRole),
        allowNull: false,
        defaultValue: AdminRole.GUEST,
    })
        role: AdminRole;

    @BelongsTo(() => Admin)
        admin: Admin;

    @BelongsTo(() => School)
        school: School;
}

export interface ISchoolAdmin {
    adminId: string;
    schoolId: number;
    role: AdminRole;
}
