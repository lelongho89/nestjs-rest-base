import { Session } from '@app/modules/session/session.model';

export type JwtRefreshPayloadType = {
  sessionId: Session['id'];
  iat: number;
  exp: number;
};
