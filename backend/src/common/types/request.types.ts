import { UserInfo } from '../../modules/user/entities/user.entity';

export interface RequestWithUser extends Request {
  user: UserInfo;
}
