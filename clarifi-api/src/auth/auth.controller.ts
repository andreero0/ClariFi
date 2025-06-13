import { Controller, Post, Body, Get, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto, SignInDto, RequestPasswordResetDto } from './dto';
import { AuthGuard } from './guards/auth.guard'; // We will create this guard next
import { User as SupabaseUser } from '@supabase/supabase-js'; // Import Supabase User type

// Custom decorator to extract user from request
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SupabaseUser | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // Assumes AuthGuard attaches user to request.user
  },
);


@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signUp(@Body() signUpDto: SignUpDto) {
    // The service will throw BadRequestException for existing users or other signup issues.
    return this.authService.signUpWithEmailPassword(signUpDto);
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  async signIn(@Body() signInDto: SignInDto) {
    // The service will throw UnauthorizedException for invalid credentials.
    return this.authService.signInWithEmailPassword(signInDto);
  }

  @UseGuards(AuthGuard) // Protect this route
  @Post('signout')
  @HttpCode(HttpStatus.OK)
  async signOut(@Req() req: any) { 
    // AuthGuard ensures req.user is populated and token is valid.
    // The actual token used by Supabase client is managed internally by the client.
    // For server-side initiated signout, if we had the raw JWT, we might pass it.
    // Here, we rely on the session associated with the Supabase client in AuthService.
    // The access token from the AuthGuard might not be directly needed by supabase.auth.signOut()
    // if the Supabase client is already initialized with it or manages its own session state.
    // For simplicity, we assume the AuthService's Supabase client handles its own session.
    // The `accessToken` parameter in `authService.signOut` might be re-evaluated.
    // For now, just calling it.
    const accessToken = req.headers.authorization?.split(' ')?.[1]; // Or however AuthGuard makes it available
    return this.authService.signOut(accessToken);
  }

  @UseGuards(AuthGuard) // Protect this route
  @Get('me')
  @HttpCode(HttpStatus.OK)
  async getMe(@CurrentUser() user: SupabaseUser) {
    // CurrentUser decorator extracts the user object attached by AuthGuard
    // Now, fetch our application-specific user profile
    return this.authService.getUserProfile(user.id);
  }
  
  @UseGuards(AuthGuard) // Protect this route
  @Get('session') // Endpoint to get current Supabase session, useful for client-side
  @HttpCode(HttpStatus.OK)
  async getSession(@CurrentUser() user: SupabaseUser) {
    // The user object itself contains most of what the client needs.
    // If the full session object from Supabase is needed, authService would need a method for it.
    // For now, just returning the Supabase user from the guard.
    const { data: { session } } = await this.authService.supabaseService.getClient().auth.getSession();
    return { user, session };
  }

  @Post('request-password-reset')
  @HttpCode(HttpStatus.OK)
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    return this.authService.sendPasswordResetEmail(requestPasswordResetDto);
  }
} 