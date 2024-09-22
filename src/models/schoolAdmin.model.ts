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

export enum SchoolAdminPermissions {
    CREATE_SCHOOL = 'create_school',
    UPDATE_SCHOOL = 'update_school',
    DELETE_SCHOOL = 'delete_school',
    DISABLE_SCHOOL = 'disable_school',
    CREATE_TEACHER = 'create_teacher',
    UPDATE_TEACHER = 'update_teacher',
    DELETE_TEACHER = 'delete_teacher',
    CREATE_ASSESSMENT = 'create_assessment',
    UPDATE_ASSESSMENT = 'update_assessment',
    DELETE_ASSESSMENT = 'delete_assessment',
    ADD_ASSESSMENT_TAKER = 'create_assessment_taker',
    REMOVE_ASSESSMENT_TAKER = 'update_assessment_taker',
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

    @Column({
        type: DataType.ARRAY(DataType.ENUM(...Object.values(SchoolAdminPermissions))),
        allowNull: true,
        set(value: SchoolAdminPermissions[]) {
            if (Array.isArray(value)) {
                const uniqueRestrictions = [...new Set(value)];
                this.setDataValue('restrictions', uniqueRestrictions);
            } else {
                this.setDataValue('restrictions', value);
            }
        },
    })
        restrictions: SchoolAdminPermissions[];
    
    @BelongsTo(() => Admin)
        admin: Admin;

    @BelongsTo(() => School)
        school: School;
}

export interface ISchoolAdmin {
    adminId: string;
    schoolId: number;
    role: AdminRole;
    restrictions?: SchoolAdminPermissions[];
}
