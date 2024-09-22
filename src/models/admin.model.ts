/* eslint-disable no-unused-vars */

import {
    Table, Column, Model, DataType, IsUUID, PrimaryKey, Default, IsEmail, Unique, BeforeFind, BelongsToMany,
} from 'sequelize-typescript';
import { FindOptions } from 'sequelize';
import School from './school.model';
import SchoolAdmin from './schoolAdmin.model';

@Table
export default class Admin extends Model<Admin | IAdmin> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

    @Column({ type: DataType.STRING, allowNull: false })
        name: string;

    @IsEmail
    @Unique
    @Column({
        type: DataType.STRING,
        allowNull: false,
        get() {
            return this.getDataValue('email').trim().toLowerCase();
        },
        set(value: string) {
            this.setDataValue('email', value.trim().toLowerCase());
        },
    })
        email: string;

    @Column({ type: DataType.BOOLEAN, defaultValue: false })
        isSuperAdmin: boolean;

    @BelongsToMany(() => School, () => SchoolAdmin)
        schools: School[];

    @BeforeFind
    static beforeFindHook(options: FindOptions) {
        if (options.where && 'email' in options.where && typeof options.where.email === 'string') {
            const whereOptions = options.where as { email?: string };
            if (whereOptions.email) {
                whereOptions.email = whereOptions.email.trim().toLowerCase();
            }
        }
    }
}

export interface IAdmin {
    name: string;
    email: string;
    isSuperAdmin?: boolean;
}