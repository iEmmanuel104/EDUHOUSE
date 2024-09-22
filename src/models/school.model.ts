import {
    Table, Column, Model, DataType, HasMany, IsUUID, PrimaryKey, Default,
    BelongsToMany,
} from 'sequelize-typescript';
import User from './user.model';
import SchoolAdmin from './schoolAdmin.model';
import Assessment from './assessment/evaluation.model';
import Admin from './admin.model';

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
        type: DataType.INTEGER,
        allowNull: false,
        unique: true,
        autoIncrement: true,
    })
        edhId: number;

    @Column({
        type: DataType.VIRTUAL,
        get() {
            return `EDH${this.getDataValue('schoolCode') + 1000}`;
        },
    })
        schoolCode: string;

    @Column({
        type: DataType.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    })
        isActive: boolean;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        logo: string;
    
    // Associations
    @HasMany(() => User)
        users: User[];

    @BelongsToMany(() => Admin, () => SchoolAdmin)
        admins: Admin[];

    @HasMany(() => Assessment)
        assessments: Assessment[];

    // Instance method to convert formatted school code to integer
    static convertFormattedCodeToInteger(formattedCode: string): number | null {
        if (formattedCode.startsWith('EDH')) {
            const numericPart = parseInt(formattedCode.slice(3), 10);
            if (!isNaN(numericPart)) {
                return numericPart - 1000;
            }
        }
        return null;
    }

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
    edhId: number;
    schoolCode: number;
    logo?: string;
    ownerId: string;
}