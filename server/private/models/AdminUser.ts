import bcrypt from 'bcrypt';
import Model from './Model';
import { is_alphanumeric } from '../../util/validator';

const SALT_ROUNDS = 10;
const is_valid_password = (pass: string) =>
  pass.length >= 2 && pass.length <= 55;

type AdminUserParameters = {
  username: string;
  password?: string;
  email?: string;
  _id?: string;
};

export default class AdminUser extends Model {
  protected props: AdminUserParameters;

  constructor(props: AdminUserParameters) {
    super('admin_users', props);
  }

  private get password(): string {
    return this.props.password;
  }

  private get username(): string {
    return this.props.username;
  }

  public async save(): Promise<AdminUser> {
    const [error, results] = await super.save({
      includeInResults: ['insertedId']
    });

    if (error) throw error;

    this.props._id = results.insertedId;

    return this;
  }

  private async populate(): Promise<AdminUser> {
    const [doc] = (await super.find({})) as AdminUserParameters[];

    this.props = { ...doc };

    return this;
  }

  public static async attempt_login(
    username: string,
    password: string
  ): Promise<[boolean, AdminUser]> {
    try {
      const searchedAdminUser = await new AdminUser({ username }).populate();

      if (!searchedAdminUser.username) return [false, null];

      const isMatchingPassword = await bcrypt.compare(
        password,
        searchedAdminUser.password
      );

      return isMatchingPassword ? [true, searchedAdminUser] : [false, null];
    } catch (error) {
      return [false, null];
    }
  }

  public static async register(
    username: string,
    password: string,
    email: string
  ): Promise<[Error, AdminUser]> {
    try {
      const [hasErr, ...errs] = AdminUser.validate_registration_credentials(
        username,
        password
      );

      if (hasErr) throw errs;

      const newlyRegisteredUser = new AdminUser({
        username,
        password: await bcrypt.hash(password, SALT_ROUNDS),
        email
      });

      return [null, await newlyRegisteredUser.save()];
    } catch (error) {
      return [Array.isArray(error) ? Error(error.join('\n')) : error, null];
    }
  }

  private static validate_registration_credentials(
    username: string,
    password: string
  ): [boolean, ...string[]] {
    const errors = [];

    if (username.length > 35) {
      errors.push('Username must be fewer than 35 characters.');
    }

    if (!is_alphanumeric(username)) {
      errors.push('Username must contain only alphanumeric characters.');
    }

    if (!is_valid_password(password)) {
      errors.push('Password is too short or too long.');
    }

    return errors.length > 0 ? [true, ...errors] : [false, null];
  }
}
