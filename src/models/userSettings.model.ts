import {
    Table, Column, Model, DataType, ForeignKey, DefaultScope,
    BelongsTo, IsUUID, Unique, PrimaryKey, Default,
} from 'sequelize-typescript';
import User from './user.model'; // Adjust the import path as necessary
import moment from 'moment';

interface IBlockUnblockEntry {
    [date: string]: string; // Key is the date in YYYY-MM-DD format, value is the reason
}

export interface IBlockMeta {
    blockHistory: IBlockUnblockEntry[];
    unblockHistory: IBlockUnblockEntry[];
}
// default scope to exclude the meta
@DefaultScope(() => ({
    attributes: { exclude: ['meta'] },
}))

@Table({ timestamps: false })
export default class UserSettings extends Model<UserSettings | IUserSettings> {
    @IsUUID(4)
    @PrimaryKey
    @Default(DataType.UUIDV4)
    @Column
        id: string;

    @Column({ type: DataType.DATEONLY })
        joinDate: string;

    @Column({
        type: DataType.DATE,
        get() {
            const rawValue = this.getDataValue('lastLogin');
            return rawValue ? moment(rawValue).format('YYYY-MM-DDTHH:mm:ssZ') : null;
        },
        set(value: Date | string) {
            if (moment.isMoment(value) || value instanceof Date || typeof value === 'string') {
                const momentDate = moment(value);
                if (momentDate.isValid()) {
                    this.setDataValue('lastLogin', momentDate.toDate());
                } else {
                    throw new Error('Invalid date format for lastLogin');
                }
            } else {
                throw new Error('Invalid input type for lastLogin');
            }
        },
    })
        lastLogin: Date;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    })
        isBlocked: boolean;

    @Column({
        type: DataType.BOOLEAN,
        defaultValue: false,
        allowNull: false,
    })
        isDeactivated: boolean;

    @Column({
        type: DataType.JSONB,
        defaultValue: null,
        allowNull: true,
    })
        meta: IBlockMeta | null;

    @IsUUID(4)
    @Unique
    @ForeignKey(() => User)
    @Column
        userId: string;

    @BelongsTo(() => User)
        user: User;
}

export interface IUserSettings {
    userId: string;
    lastLogin?: Date;
    joinDate: string;
    isBlocked?: boolean;
    isDeactivated?: boolean;
    meta?: IBlockMeta | null;
}