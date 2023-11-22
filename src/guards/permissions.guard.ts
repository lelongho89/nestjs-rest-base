import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) { }

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getClass(),
      context.getHandler(),
    ]);
    if (!requiredPermissions.length) {
      return true;
    }

    const checkPermissions = (permissions: string[], requiredPermissions: string[]) => {
      permissions = permissions.map(permission => permission.toLowerCase());
      return requiredPermissions.filter(permission =>
        permissions.indexOf(permission.toLowerCase()) !== -1
      ).length > 0
    };

    const request = context.switchToHttp().getRequest();
    return checkPermissions(request.user?.permissions || [], requiredPermissions);
  }
}
