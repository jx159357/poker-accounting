import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 重写 canActivate 方法，使其不抛出异常
  canActivate(context: ExecutionContext) {
    // 调用父类的 canActivate，但捕获异常
    return super.canActivate(context);
  }

  // 重写 handleRequest 方法，允许未认证的请求通过
  handleRequest(err, user, info) {
    // 如果有错误或没有用户，返回 null 而不是抛出异常
    // 这样游客也可以访问
    if (err || !user) {
      return null;
    }
    return user;
  }
}
