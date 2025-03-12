import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/entity/User';

export interface RequestWithUser extends Request {
  user?: User;
}

export const GetUser = createParamDecorator<User>(
  (data: never, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    if (!request.user) throw new Error('User not found in request object');

    return request.user;
  },
);
