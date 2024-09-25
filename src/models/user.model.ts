/* eslint-disable no-unused-vars */
import {
    Table, Column, Model, DataType, HasOne, Default, BeforeFind, Scopes, BeforeValidate,
    IsEmail, IsUUID, PrimaryKey, Index, BeforeCreate, BeforeUpdate, BelongsToMany,
} from 'sequelize-typescript';
import Password from './password.model';
import UserSettings from './userSettings.model';
import { FindOptions } from 'sequelize';
import School from './school.model';
import Assessment from './evaluation/assessment.model';
import AssessmentTaker from './evaluation/takers.model';
import SchoolTeacher from './schoolTeacher.model';
import { BadRequestError } from '../utils/customErrors';

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
        registrationNumber: string;

    @Column({
        type: DataType.STRING,
        allowNull: false,
    })
        gender: string;

    @Column({ type: DataType.STRING })
        displayImage: string;

    @Column({ type: DataType.JSONB, allowNull: false, defaultValue: { activated: false, emailVerified: false } })
        status: {
        activated: boolean;
        emailVerified: boolean;
    };

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
        type: DataType.DATEONLY, // YYYY-MM-DD
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

    @BeforeValidate
    static async generateRegistrationNumber(instance: User) {
        if (!instance.registrationNumber) {
            const year = new Date().getFullYear();
            const randomNum = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
            const randomChars = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                String.fromCharCode(65 + Math.floor(Math.random() * 26));
            instance.registrationNumber = `${year}${randomNum}${randomChars}`;

            // Ensure uniqueness
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 3; // Prevent infinite loop
            while (!isUnique && attempts < maxAttempts) {
                const existingUser = await User.findOne({ where: { registrationNumber: instance.registrationNumber } });
                if (!existingUser) {
                    isUnique = true;
                } else {
                    // If not unique, generate a new number
                    const newRandomNum = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
                    const newRandomChars = String.fromCharCode(65 + Math.floor(Math.random() * 26)) +
                        String.fromCharCode(65 + Math.floor(Math.random() * 26));
                    instance.registrationNumber = `${year}${newRandomNum}${newRandomChars}`;
                }
                attempts++;
            }

            if (!isUnique) {
                throw new BadRequestError('Error generating registration number, please try again');
            }
        }
    }

    @BelongsToMany(() => Assessment, {
        through: () => AssessmentTaker,
        foreignKey: 'teacherId',
        otherKey: 'assessmentId',
    })
        assessments: Assessment[];

    @BelongsToMany(() => School, () => SchoolTeacher)
        schools: School[];

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
    gender: string;
    dob?: Date;
}