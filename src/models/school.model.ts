import {
    Table, Column, Model, DataType, HasMany, IsUUID, PrimaryKey, Default,
    BelongsToMany,
} from 'sequelize-typescript';
import User from './user.model';
import Teacher from './teacher.model';
import SchoolAdmin from './schoolAdmin.model';
import Assessment from './assessment/evaluation.model';

@Table
export default class School extends Model<School | ISchool> {
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
        type: DataType.JSONB,
        allowNull: false,
    })
        location: {
        address: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };

    @Column({
        type: DataType.STRING,
        allowNull: false,
        unique: true,
    })
        registrationId: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
        isActive: boolean;

    // Associations

    @HasMany(() => Teacher)
        teachers: Teacher[];

    @BelongsToMany(() => User, () => SchoolAdmin)
        admins: User[];

    @HasMany(() => Assessment)
        assessments: Assessment[];
}

export interface ISchool {
    id?: string;
    name: string;
    location: {
        address: string;
        city: string;
        state: string;
        country: string;
        postalCode: string;
    };
    registrationId: string;
    isActive: boolean;
    ownerId: string;
}