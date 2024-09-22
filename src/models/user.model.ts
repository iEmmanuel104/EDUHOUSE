/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, HasOne, Default, BeforeFind, Scopes, BelongsTo,
    IsEmail, IsUUID, PrimaryKey, Index, BeforeCreate, BeforeUpdate, BelongsToMany, ForeignKey,
} from 'sequelize-typescript';
import Password from './password.model';
import { Sequelize } from 'sequelize';
import UserSettings from './userSettings.model';
import { FindOptions } from 'sequelize';
import School from './school.model';
import Assessment from './evaluation/assessment.model';
import AssessmentTaker from './evaluation/takers.model';

@Scopes(() => ({
    withSettings: {
        include: [
            {
                model: UserSettings,
                as: 'settings',
                attributes: ['joinDate', 'isBlocked', 'isDeactivated', 'lastLogin', 'meta'],
            },
        ],
    },
    School: (schoolId: number) => ({
        where: { schoolId },
    }),
}))

@Table
export default class User extends Model<User | IUser> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

    @IsEmail
    @Index
    @Column({
        type: DataType.STRING, allowNull: false,
        get() {
            return this.getDataValue('email').trim().toLowerCase();
        },
        set(value: string) {
            this.setDataValue('email', value.trim().toLowerCase());
        },
    })
        email: string;

    @Index
    @Column({
        type: DataType.STRING,
        allowNull: false,
        set(value: string) {
            this.setDataValue('firstName', User.capitalizeFirstLetter(value));
        },
    })
        firstName: string;

    @Index
    @Column({
        type: DataType.STRING,
        allowNull: false,
        set(value: string) {
            this.setDataValue('lastName', User.capitalizeFirstLetter(value));
        },
    })
        lastName: string;

    @Column({
        type: DataType.STRING,
        set(value: string) {
            if (value) {
                this.setDataValue('otherName', User.capitalizeFirstLetter(value));
            }
        },
    })
        otherName: string;

    @Column({
        type: DataType.STRING(14),
        unique: true,
        allowNull: false,
    })
    @Default(
        Sequelize.literal(`
            CONCAT(
                EXTRACT(YEAR FROM CURRENT_DATE)::TEXT,
                LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0'),
                CHR(65 + FLOOR(RANDOM() * 26))::TEXT,
                CHR(65 + FLOOR(RANDOM() * 26))::TEXT
            )
        `)
    )
        registrationNumber: string;

    @Column({ type: DataType.STRING })
        gender: string;

    @Column({ type: DataType.STRING })
        displayImage: string;

    @Column({ type: DataType.JSONB, allowNull: false, defaultValue: { activated: false, emailVerified: false } })
        status: {
        activated: boolean;
        emailVerified: boolean;
    };

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

    @Column({
        type: DataType.VIRTUAL,
        get() {
            if (this.getDataValue('otherName')) {
                return `${this.getDataValue('firstName')} ${this.getDataValue('lastName')} ${this.getDataValue('otherName')}`.trim();
            } else {
                return `${this.getDataValue('firstName')} ${this.getDataValue('lastName')}`.trim();
            }
        },
        set(value: string) {
            const names = value.split(' ');
            this.setDataValue('firstName', names[0]);
            this.setDataValue('lastName', names.slice(1).join(' '));
        },
    })
        fullName: string;

    @Column({ type: DataType.JSONB })
        phone: {
        countryCode: string;
        number: string;
    };

    @Column({
        type: DataType.DATEONLY,
        validate: {
            isDate: true,
            isValidDate(value: string | Date) {
                if (new Date(value) > new Date()) {
                    throw new Error('Date of birth cannot be in the future');
                }
            },
        },
    })
        dob: Date;


    @ForeignKey(() => School)
    @Column
        schoolId: number;

    // Associations
    @HasOne(() => Password)
        password: Password;

    @HasOne(() => UserSettings)
        settings: UserSettings;

    @BeforeFind
    static beforeFindHook(options: FindOptions) {
        if (options.where && 'email' in options.where && typeof options.where.email === 'string') {
            const whereOptions = options.where as { email?: string };
            if (whereOptions.email) {
                whereOptions.email = whereOptions.email.trim().toLowerCase();
            }
        }
    }

    @BeforeCreate
    @BeforeUpdate
    static beforeSaveHook(instance: User) {
        // Only capitalize if the field is changed (for updates) or new (for creates)
        if (instance.changed('firstName')) {
            instance.firstName = User.capitalizeFirstLetter(instance.firstName);
        }
        if (instance.changed('lastName')) {
            instance.lastName = User.capitalizeFirstLetter(instance.lastName);
        }
        if (instance.changed('otherName') && instance.otherName) {
            instance.otherName = User.capitalizeFirstLetter(instance.otherName);
        }
    }

    @BelongsToMany(() => Assessment, {
        through: () => AssessmentTaker,
        foreignKey: 'userId',
        otherKey: 'assessmentId',
    })
        assessments: Assessment[];

    @BelongsTo(() => School)
        school: School;

    static capitalizeFirstLetter(str: string): string {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

export interface IUser {
    email: string;
    firstName: string;
    lastName: string;
    otherName?: string;
    registrationNumber?: string;
    status: {
        activated: boolean;
        emailVerified: boolean;
    };
    displayImage?: string;
    fullName?: string;
    phone?: {
        countryCode: string;
        number: string
    };
    dob?: Date;
    isTeachingStaff?: boolean;
    classAssigned?: string;
    schoolId: number;
}