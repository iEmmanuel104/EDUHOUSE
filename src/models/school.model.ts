import {
    Table, Column, Model, DataType, HasMany, PrimaryKey, AutoIncrement, BelongsToMany,
} from 'sequelize-typescript';
import User from './user.model';
import SchoolAdmin from './schoolAdmin.model';
import Assessment from './evaluation/assessment.model';
import Admin from './admin.model';

@Table
export default class School extends Model<School | ISchool> {

    @PrimaryKey
    @AutoIncrement
    @Column(DataType.INTEGER)
        id: number;

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
        type: DataType.VIRTUAL,
        get() {
            return `EDH${this.getDataValue('edhId') + 1000}`;
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

    // Static method to convert formatted school code to integer
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
    id?: number;
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
    schoolCode?: string;
    logo?: string;
    ownerId: string;
}