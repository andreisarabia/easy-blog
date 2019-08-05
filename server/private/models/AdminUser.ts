import Model from './Model';
import { is_alphanumeric } from '../../util/validator';

type AdminUserParameters = {
  username: string;
  password: string;
  _id?: string;
};

export default class AdminUser extends Model {
  protected props: AdminUserParameters;

  constructor(props = {}) {
    super('admin_users', props);
  }

  public async save(): Promise<AdminUser> {
    const [error, results] = await super.save({
      includeInResults: ['insertedId']
    });

    if (error) throw error;

    this.props._id = results.insertedId;

    return this;
  }

  public static validate_registration_credentials(
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

    return errors.length > 0 ? [true, ...errors] : [false, null];
  }
}
