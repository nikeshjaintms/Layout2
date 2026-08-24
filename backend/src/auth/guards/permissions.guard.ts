import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredPermissions) {
      return true; // No permissions required
    }
    
    const { user } = context.switchToHttp().getRequest();
    

    if (!user) {
      return false; // Not authenticated
    }

    if (user.role === 'ADMIN') {
      return true; // Global admin override
    }

    const userPermissions = user.permissions || [];
    
    // User must possess ALL required permissions
    return requiredPermissions.every((permission) => userPermissions.includes(permission));
  }
}
