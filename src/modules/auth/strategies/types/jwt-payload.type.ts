import { Session } from '@app/modules/session/session.model';
import { User } from '../../../user/user.model';

export type JwtPayloadType = Pick<User, 'id' | 'role'> & {
  sessionId: Session['id'];
  iat: number;
  exp: number;
};
