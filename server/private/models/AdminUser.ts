import Model from './Model';
import { is_alphanumeric } from '../../util/validator';

export default class AdminUser extends Model {
  constructor(props = {}) {
    super('admin_users', props);
  }

  public static validate_registration_credentials(
    username: string,
    password: string
  ): string[] {
    const errors = [];

    if (username.length > 35) {
      errors.push('Username must be fewer than 35 characters.');
    }

    if (!is_alphanumeric(username)) {
      errors.push('Username must contain only alphanumeric characters.');
    }

    return errors;
  }
}
