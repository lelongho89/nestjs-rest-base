import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import { User } from "@app/modules/user/user.model";

/*
The `LoggedInUser` decorator is used to get the user object from the request object.
*/
export const LoggedInUser = createParamDecorator((data: keyof User, ctx: ExecutionContext) => {
  let request = ctx.switchToHttp().getRequest();

  if (ctx.getType() === "ws")
    request = ctx.switchToWs().getClient().handshake;

  const user = request.user as User;

  return data ? user[data] : user;
});
