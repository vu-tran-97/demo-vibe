import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestUser } from '../../firebase/firebase-auth.guard';

export const CurrentUser = createParamDecorator(
  (data: keyof RequestUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as RequestUser;
    if (data) {
      return user[data];
    }
    return user;
  },
);
