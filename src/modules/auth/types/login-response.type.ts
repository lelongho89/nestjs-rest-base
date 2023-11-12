import { User } from '../../user/user.model';

export type LoginResponseType = Readonly<{
  token: string;
  refresh_token: string;
  token_expires: number;
  user: User;
}>;
