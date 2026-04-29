import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(registerDto: RegisterDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: [
        { username: registerDto.username },
        { email: registerDto.email },
        { phone: registerDto.phone },
      ],
    });

    if (existingUser) {
      throw new ConflictException('Username, email or phone already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = this.userRepository.create({
      ...registerDto,
      password: hashedPassword,
      role: UserRole.USER,
    });

    return this.userRepository.save(user);
  }

  async findAll(currentUser: User): Promise<User[]> {
    // Admin can see all users, regular users can only see themselves
    if (currentUser.role === UserRole.ADMIN) {
      return this.userRepository.find({
        select: ['id', 'username', 'email', 'phone', 'avatar', 'role', 'isActive', 'createdAt', 'updatedAt'],
      });
    }
    return [];
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: User): Promise<User> {
    const user = await this.findById(id);

    // Regular users can only update themselves
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ConflictException('You can only update your own profile');
    }

    // Only admin can change role
    if (updateUserDto.role && currentUser.role !== UserRole.ADMIN) {
      delete updateUserDto.role;
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async changePassword(id: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await this.findById(id);

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new ConflictException('Invalid old password');
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await this.userRepository.save(user);
  }

  async remove(id: string, currentUser: User): Promise<void> {
    const user = await this.findById(id);

    // Only admin can delete users, and cannot delete themselves
    if (currentUser.role !== UserRole.ADMIN) {
      throw new ConflictException('Only admin can delete users');
    }

    if (id === currentUser.id) {
      throw new ConflictException('Cannot delete yourself');
    }

    await this.userRepository.softRemove(user);
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: [{ username }, { email: username }, { phone: username }],
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
