import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { User } from '../src/modules/user/entities/user.entity';
import * as bcrypt from 'bcrypt';

async function createAdmin() {
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get DataSource from TypeORM
  const dataSource = app.get(DataSource);
  const userRepository = dataSource.getRepository(User);

  const existingAdmin = await userRepository.findOne({ where: { username: 'admin' } });
  if (existingAdmin) {
    console.log('管理员账号已存在');
    await app.close();
    return;
  }

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = userRepository.create({
    username: 'admin',
    password: hashedPassword,
    role: 'admin' as any,
    email: 'admin@example.com',
    phone: '13800138000',
  });

  await userRepository.save(admin);

  console.log('管理员账号创建成功！');
  console.log('用户名: admin');
  console.log('密码: admin123');

  await app.close();
}

createAdmin();
