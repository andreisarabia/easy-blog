import bcrypt from 'bcrypt';
import uuid from 'uuid/v4';
import Model from './Model';
import { is_alphanumeric, is_email } from '../../util/validator';

const SALT_ROUNDS = 10;
const MIN_USERNAME_LENGTH = 5;
const MAX_USERNAME_LENGTH = 35;
const MIN_PASSWORD_LENGTH = 13;
const MAX_PASSWORD_LENGTH = 55;
const COLLECTION_NAME = 'admin_users';

export type AdminUserParameters = {
  username: string;
  password?: string;
  email?: string;
  cookie?: string;
  cookieName?: string;
  _id?: string;
};

export default class AdminUser extends Model {
  protected props: AdminUserParameters;

  constructor(props: AdminUserParameters) {
    super(AdminUser.collectionName, props);
  }

  private get password(): string {
    return this.props.password;
  }

  public get username(): string {
    return this.props.username;
  }

  public get email(): string {
    return this.props.email;
  }

  public get cookieId(): string {
    return this.props.cookie;
  }

  private static get collectionName(): string {
    return COLLECTION_NAME;
  }

  public async save(): Promise<AdminUser> {
    const [error, results] = await super.save({
      includeInResults: ['insertedId']
    });

    if (error) throw error;

    this.props._id = results.insertedId;

    return this;
  }

  public static async find(username: string): Promise<AdminUser> {
    const doc = (await Model.search({
      collection: AdminUser.collectionName,
      criteria: { username },
      limit: 1
    })) as AdminUserParameters;

    return doc ? new AdminUser(doc) : null;
  }

  public static async attempt_login(
    username: string,
    password: string
  ): Promise<[Error, AdminUser]> {
    if (!username || !password) {
      return [Error('Either a username or password were not submitted.'), null];
    }

    const [err, user] = await AdminUser.login(username, password);

    return err ? [err, null] : [null, user];
  }

  public static async register({
    username,
    email,
    password,
    cookieName
  }: AdminUserParameters): Promise<[Error, AdminUser]> {
    const errs = await AdminUser.validate_credentials(
      username,
      password,
      email
    );

    if (errs.length > 0) return [Error(errs.join('\n')), null];

    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    const newlyRegisteredUser = await new AdminUser({
      username,
      password: hash,
      email,
      cookieName,
      cookie: cookieName ? uuid() : undefined
    }).save();

    return [null, newlyRegisteredUser];
  }

  private static async validate_credentials(
    username: string,
    password: string,
    email: string
  ): Promise<string[]> {
    const errors = [];

    if (await AdminUser.exists(username)) errors.push('Username is not valid.');

    if (username.length > MAX_USERNAME_LENGTH) {
      errors.push(
        `Username must be fewer than ${MAX_USERNAME_LENGTH} characters.`
      );
    } else if (username.length < MIN_USERNAME_LENGTH) {
      errors.push(
        `Username must be more than ${MIN_USERNAME_LENGTH} characters.`
      );
    }

    if (!is_alphanumeric(username)) {
      errors.push('Username must contain only alphanumeric characters.');
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      errors.push(
        `Password must be fewer than ${MAX_PASSWORD_LENGTH} characters.`
      );
    } else if (password.length < MIN_PASSWORD_LENGTH) {
      errors.push(
        `Password must be more than ${MIN_PASSWORD_LENGTH} characters.`
      );
    }

    if (!is_email(email)) {
      errors.push(`The provided email is formatted incorrectly.`);
    }

    return errors;
  }

  private static async login(
    username: string,
    password: string
  ): Promise<[Error, AdminUser]> {
    try {
      const user = await AdminUser.find(username);
      const isMatchingPassword = await bcrypt.compare(
        password,
        user ? user.password : ''
      );

      return isMatchingPassword
        ? [null, user]
        : [Error('User and password combination do not exist.'), null];
    } catch (error) {
      return [error, null];
    }
  }

  private static async exists(username: string): Promise<boolean> {
    try {
      const searchedAdminUser = await AdminUser.find(username);
      return Boolean(searchedAdminUser.username && searchedAdminUser.email);
    } catch (error) {
      return false;
    }
  }
}
