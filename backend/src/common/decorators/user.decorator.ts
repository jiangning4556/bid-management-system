import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface UserInfo {
  id: string;
  username: string;
  role: string;
}

export const User = createParamDecorator(
  (data: keyof UserInfo | undefined, ctx: ExecutionContext): UserInfo | any => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as UserInfo;

    return data ? user?.[data] : user;
  },
);
