import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  private readonly logger = new Logger(AuthGuard.name);

  constructor(private readonly authService: AuthService) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) {
      throw new UnauthorizedException('Authorization header is missing.');
    }

    const parts = authorizationHeader.split(' ');
    if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
      throw new UnauthorizedException('Invalid authorization header format. Expected Bearer token.');
    }

    const token = parts[1];

    return this.validateToken(token, request);
  }

  private async validateToken(token: string, request: any): Promise<boolean> {
    try {
      const user = await this.authService.getAuthenticatedUser(token);
      if (user) {
        request.user = user; // Attach user to the request object
        return true;
      }
      // If getAuthenticatedUser returns null but no error, it means token is invalid or expired.
      throw new UnauthorizedException('Invalid or expired token.');
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error; // Re-throw if it's already an UnauthorizedException
      }
      this.logger.error('Error during token validation in AuthGuard:', error.stack);
      // For other errors (e.g., Supabase service unavailable), throw a generic error
      throw new InternalServerErrorException('Could not process authentication token.');
    }
  }
} 