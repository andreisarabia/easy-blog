import Model from './Model';

export default class AdminUser extends Model {
  constructor(props = {}) {
    super('admin_users', props);
  }
}
