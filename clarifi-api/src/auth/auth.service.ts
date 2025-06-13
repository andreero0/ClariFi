import { Injectable, UnauthorizedException, InternalServerErrorException, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto, SignInDto, RequestPasswordResetDto } from './dto'; // We'll create these DTOs later
import { User } from '@supabase/supabase-js';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    public readonly supabaseService: SupabaseService,
    private readonly prismaService: PrismaService,
  ) {}

  private get supabase() {
    return this.supabaseService.getClient();
  }

  async signUpWithEmailPassword(signUpDto: SignUpDto) {
    const { email, password, displayName } = signUpDto;

    const { data: signUpData, error: signUpError } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName, // Supabase allows some metadata during signup
        },
      },
    });

    if (signUpError) {
      this.logger.error(`Supabase signUp error: ${signUpError.message}`, signUpError.stack);
      if (signUpError.status === 400 || signUpError.message.toLowerCase().includes('already registered')) {
        throw new BadRequestException(signUpError.message);
      }
      throw new InternalServerErrorException('Could not sign up user.');
    }

    if (!signUpData.user) {
      this.logger.error('Supabase signUp did not return a user object.');
      throw new InternalServerErrorException('User registration failed.');
    }
    
    // Supabase might require email confirmation. 
    // The user object is created in Supabase Auth regardless.
    // We create our profile entry immediately.

    try {
      const userProfile = await this.prismaService.users_profile.create({
        data: {
          id: signUpData.user.id, // Use Supabase user ID as our profile ID
          email: signUpData.user.email || email, // Use fallback email from DTO if user.email is undefined
          display_name: displayName || signUpData.user.user_metadata?.display_name,
          // onboarding_completed will default to false as per schema
          // preferred_language will default as per schema
        },
      });
      this.logger.log(`User profile created for ${userProfile.email} with ID ${userProfile.id}`);
      
      // Depending on email confirmation settings, signUpData.session might be null.
      // If email confirmation is enabled, the user won't have a session until they confirm.
      return { 
        user: signUpData.user, 
        session: signUpData.session,
        message: signUpData.session ? 'Signup successful.' : 'Signup successful. Please check your email to confirm your account.'
      };

    } catch (prismaError) {
      this.logger.error(`Prisma create user_profile error: ${prismaError.message}`, prismaError.stack);
      // Potentially try to clean up the Supabase auth user if profile creation fails, though this is complex.
      // For now, log and throw.
      throw new InternalServerErrorException('Could not create user profile after signup.');
    }
  }

  async signInWithEmailPassword(signInDto: SignInDto) {
    const { email, password } = signInDto;
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      this.logger.warn(`Supabase signIn error for ${email}: ${error.message}`);
      throw new UnauthorizedException(error.message || 'Invalid credentials.');
    }
    if (!data.session || !data.user) {
        this.logger.error('Supabase signIn did not return session or user.');
        throw new InternalServerErrorException('Sign in failed.');
    }
    
    // Optionally update last_login_at in users_profile
    try {
        await this.prismaService.users_profile.update({
            where: { id: data.user.id },
            data: { last_login_at: new Date() },
        });
    } catch (e) {
        this.logger.warn(`Failed to update last_login_at for user ${data.user.id}`, e.message);
    }

    return { user: data.user, session: data.session };
  }

  async signOut(accessToken: string): Promise<{ error: any }> {
    // Supabase client signOut invalidates the session for the current client instance.
    // For server-side signout where you have the JWT, use auth.admin.signOut(jwt)
    // However, the simplest way is to call it on the client that has the token.
    // If this service is called with a user's JWT, we should use the admin API if available/configured,
    // or acknowledge that client-side signOut is generally preferred.
    // For now, assuming this is called in a context where the service's Supabase client holds the session.
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      this.logger.error(`Supabase signOut error: ${error.message}`, error.stack);
    }
    return { error };
  }
  
  async getAuthenticatedUser(accessToken: string): Promise<User | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser(accessToken);
    if (error) {
      this.logger.warn(`Supabase getUser error: ${error.message}`);
      // Do not throw UnauthorizedException here, let the AuthGuard handle it.
      // This service simply reports if a user can be fetched or not.
      return null;
    }
    return user;
  }

  async getUserProfile(userId: string) {
    const profile = await this.prismaService.users_profile.findUnique({
        where: { id: userId },
    });
    if (!profile) {
        throw new NotFoundException(`User profile not found for ID: ${userId}`);
    }
    return profile;
  }

  async sendPasswordResetEmail(requestPasswordResetDto: RequestPasswordResetDto) {
    const { email } = requestPasswordResetDto;
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      // redirectTo: 'your-app-password-reset-page-url' // Optional: configure in Supabase dashboard
    });

    if (error) {
      this.logger.error(`Supabase resetPasswordForEmail error for ${email}: ${error.message}`, error.stack);
      // Don't reveal if email exists or not for security, but Supabase might do that anyway.
      throw new InternalServerErrorException('Could not send password reset email.');
    }
    return { message: 'Password reset email sent. Please check your inbox.' };
  }
} 