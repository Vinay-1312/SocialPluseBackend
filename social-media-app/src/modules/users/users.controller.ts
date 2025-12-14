import { Controller, Post, Body, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { UsersService } from './users.service';
import {
  SignupDto,
  SignupResponseDto,
  UserResponseDto,
} from 'src/common/dto/User';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Post('signup')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created',
    type: SignupResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input' })
  @ApiResponse({ status: 409, description: 'Conflict - User already exists' })
  createUser(@Body() createUserDto: SignupDto) {
    return this.userService.signup(createUserDto);
  }
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({
    status: 200,
    description: 'List of all users',
    type: [UserResponseDto],
  })
  getAllUsers() {
    return this.userService.getAllUsers();
  }
}
