"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt_1 = __importDefault(require("bcrypt"));
const v4_1 = __importDefault(require("uuid/v4"));
const Model_1 = __importDefault(require("./Model"));
const validator_1 = require("../../util/validator");
const SALT_ROUNDS = 10;
const MIN_USERNAME_LENGTH = 5;
const MAX_USERNAME_LENGTH = 35;
const MIN_PASSWORD_LENGTH = 13;
const MAX_PASSWORD_LENGTH = 55;
class AdminUser extends Model_1.default {
    constructor(props) {
        super(AdminUser.collectionName, props);
    }
    get password() {
        return this.props.password;
    }
    get username() {
        return this.props.username;
    }
    get email() {
        return this.props.email;
    }
    get cookieId() {
        return this.props.cookie;
    }
    static get collectionName() {
        return 'admin_users';
    }
    async save() {
        const [error, results] = await super.save({
            includeInResults: ['insertedId']
        });
        if (error)
            throw error;
        this.props._id = results.insertedId;
        return this;
    }
    static async find(username) {
        const doc = (await Model_1.default.find(AdminUser.collectionName, { username }, 1));
        return Object.keys(doc).length === 0 ? null : new AdminUser(doc);
    }
    static async attempt_login(username, password) {
        if (!username || !password) {
            return [Error('Either a user or password were not sent.'), null];
        }
        const searchedAdminUser = await AdminUser.find(username);
        if (!searchedAdminUser.username || !searchedAdminUser.password) {
            return [Error('User and password combination do not exist.'), null];
        }
        const isMatchingPassword = await bcrypt_1.default.compare(password, searchedAdminUser.password);
        return isMatchingPassword
            ? [null, searchedAdminUser]
            : [Error('User and password combination do not exist.'), null];
    }
    static async register(username, password, email, cookieName) {
        const [hasErr, ...errs] = await AdminUser.validate_credentials(username, password, email);
        if (hasErr)
            return [Error(errs.join('\n')), null];
        const adminUserParams = {
            username,
            password: await bcrypt_1.default.hash(password, SALT_ROUNDS),
            email
        };
        if (cookieName) {
            adminUserParams.cookie = v4_1.default();
            adminUserParams.cookieName = cookieName;
        }
        const newlyRegisteredUser = await new AdminUser(adminUserParams).save();
        return [null, newlyRegisteredUser];
    }
    static async validate_credentials(username, password, email) {
        if (await AdminUser.exists(username)) {
            return [true, 'Username is not valid.'];
        }
        const errors = [];
        if (username.length > MAX_USERNAME_LENGTH) {
            errors.push(`Username must be fewer than ${MAX_USERNAME_LENGTH} characters.`);
        }
        else if (username.length < MIN_USERNAME_LENGTH) {
            errors.push(`Username must be more than ${MIN_USERNAME_LENGTH} characters.`);
        }
        if (!validator_1.is_alphanumeric(username)) {
            errors.push('Username must contain only alphanumeric characters.');
        }
        if (password.length > MAX_PASSWORD_LENGTH) {
            errors.push(`Password must be fewer than ${MAX_PASSWORD_LENGTH} characters.`);
        }
        else if (password.length < MIN_PASSWORD_LENGTH) {
            errors.push(`Password must be more than ${MIN_PASSWORD_LENGTH} characters.`);
        }
        if (!validator_1.is_email(email)) {
            errors.push(`The provided email is formatted incorrectly.`);
        }
        return errors.length > 0 ? [true, ...errors] : [false, null];
    }
    static async exists(username) {
        const searchedAdminUser = await AdminUser.find(username);
        return Boolean(searchedAdminUser.username && searchedAdminUser.email);
    }
}
exports.default = AdminUser;
