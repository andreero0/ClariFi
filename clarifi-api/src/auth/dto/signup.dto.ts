import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';

export class SignUpDto {
  @IsEmail({}, { message: 'Please enter a valid email address.' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(100, { message: 'Password cannot be longer than 100 characters.' })
  // Add regex for password complexity if desired, e.g.,
  // @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, { message: 'Password too weak' })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  displayName?: string;
} 