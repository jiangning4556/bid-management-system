import { DataSource } from 'typeorm';
import { User } from '../src/modules/user/entities/user.entity';

async function checkAdmin() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'jn456521',
    database: 'bid_management',
    entities: [User],
    synchronize: false,
  });

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const admin = await userRepository.findOne({ where: { username: 'admin' } });

  if (admin) {
    console.log('管理员账号已存在');
    console.log('用户名:', admin.username);
    console.log('角色:', admin.role);
  } else {
    console.log('管理员账号不存在，请先运行创建脚本');
  }

  await dataSource.destroy();
}

checkAdmin().catch(console.error);
