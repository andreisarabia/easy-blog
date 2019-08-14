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
const is_valid_password = (pass) => pass.length >= 2 && pass.length <= 55;
class AdminUser extends Model_1.default {
    constructor(props) {
        super('admin_users', props);
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
    async save() {
        const [error, results] = await super.save({
            includeInResults: ['insertedId']
        });
        if (error)
            throw error;
        this.props._id = results.insertedId;
        return this;
    }
    async populate() {
        const criteria = this.username
            ? { username: this.username }
            : { email: this.email };
        const doc = (await super.find(criteria, 1));
        this.props = { ...doc };
        return this;
    }
    static async attempt_login(username, password) {
        if (!username || !password) {
            return [Error('Either a user or password were not sent.'), null];
        }
        const searchedAdminUser = await new AdminUser({ username }).populate();
        if (!searchedAdminUser.username || !searchedAdminUser.password) {
            return [Error('User and password combination do not exist.'), null];
        }
        const isMatchingPassword = await bcrypt_1.default.compare(password, searchedAdminUser.password);
        return isMatchingPassword
            ? [null, searchedAdminUser]
            : [Error('User and password combination do not exist.'), null];
    }
    static async register(username, password, email, cookieName) {
        const [hasErr, ...errs] = await AdminUser.validate_credentials(username, password);
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
    static async validate_credentials(username, password) {
        if (await AdminUser.exists(username)) {
            return [true, 'Username is not valid.'];
        }
        const errors = [];
        if (username.length > 35) {
            errors.push('Username must be fewer than 35 characters.');
        }
        if (!validator_1.is_alphanumeric(username)) {
            errors.push('Username must contain only alphanumeric characters.');
        }
        if (!is_valid_password(password)) {
            errors.push('Password is too short or too long.');
        }
        return errors.length > 0 ? [true, ...errors] : [false, null];
    }
    static async exists(username) {
        const searchedAdminUser = await new AdminUser({ username }).populate();
        return Boolean(searchedAdminUser.username && searchedAdminUser.email);
    }
}
exports.default = AdminUser;
