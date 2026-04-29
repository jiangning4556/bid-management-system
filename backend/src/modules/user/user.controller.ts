import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { User } from '../../common/decorators/user.decorator';
import { UserRole } from './entities/user.entity';
import type { UserInfo } from './entities/user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @Public()
  async create(@Body() registerDto: RegisterDto) {
    const user = await this.userService.create(registerDto);
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      phone: user.phone,
      role: user.role,
    };
  }

  @Get()
  @Roles(UserRole.ADMIN)
  findAll(@User() user: UserInfo) {
    return this.userService.findAll(user as any);
  }

  @Get('profile')
  getProfile(@User() user: UserInfo) {
    return this.userService.findById(user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.userService.findById(id);
  }

  @Patch('profile')
  updateProfile(
    @User() user: UserInfo,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(user.id, updateUserDto, user as any);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @User() currentUser: UserInfo,
  ) {
    return this.userService.update(id, updateUserDto, currentUser as any);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string, @User() user: UserInfo) {
    return this.userService.remove(id, user as any);
  }
}
