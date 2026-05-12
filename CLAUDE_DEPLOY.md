# 给 Claude Code 的部署指令模板

在服务器上使用 Claude Code 部署时，可以直接复制以下指令：

---

## 阶段 1：环境准备

```
请帮我检查服务器环境：
1. 检查 Docker 是否安装并显示版本
2. 检查 Docker Compose 是否可用
3. 检查磁盘空间（至少需要 10GB 可用空间）
4. 检查内存（至少需要 4GB）
5. 检查端口 80、3000、3306 是否被占用
```

## 阶段 2：配置环境变量

```
请帮我配置环境变量：
1. 复制 .env.example 到 .env（如果 .env 不存在）
2. 生成强随机 MYSQL_ROOT_PASSWORD（使用 openssl rand -base64 32）
3. 生成强随机 MYSQL_PASSWORD（使用 openssl rand -base64 32）
4. 生成强随机 JWT_SECRET（使用 openssl rand -base64 64）
5. 更新 .env 文件，替换所有占位符密码
6. 创建 .env.secrets 文件保存密钥，设置权限为 600
7. 显示生成的密码（提醒用户保存）
```

## 阶段 3：创建目录结构

```
请创建以下目录结构：
- docker/mysql/conf.d
- docker/mysql/init
- docker/nginx/conf.d
- docker/nginx/ssl
- backend/logs
- backups
```

## 阶段 4：配置文件检查

```
请检查以下配置文件是否存在：
1. docker-compose.yml
2. backend/Dockerfile
3. frontend2/Dockerfile
4. docker/nginx/nginx.conf
5. docker/nginx/conf.d/bid-management.conf
6. docker/mysql/init/01-init-database.sql
7. docker/mysql/conf.d/my.cnf

如果缺失，请告诉我需要创建哪些文件。
```

## 阶段 5：构建镜像

```
请帮我构建 Docker 镜像：
1. 显示当前目录和 docker-compose.yml 位置
2. 运行 docker compose build
3. 显示构建进度
4. 如果构建失败，显示错误日志并分析原因
```

## 阶段 6：启动服务

```
请帮我启动 Docker 服务：
1. 运行 docker compose up -d
2. 显示容器启动状态
3. 等待 10 秒后再次检查状态
4. 显示所有容器的健康状态
```

## 阶段 7：数据库初始化

```
请帮我初始化数据库：
1. 等待 MySQL 容器健康检查通过
2. 检查后端容器是否已连接数据库
3. 在后端容器中运行 node scripts/create-admin.js
4. 验证管理员账户是否创建成功
5. 如果失败，检查后端日志并分析原因
```

## 阶段 8：验证部署

```
请帮我验证部署是否成功：
1. 显示所有容器状态（docker compose ps）
2. 测试后端健康检查：curl http://localhost:3000/health
3. 测试前端访问：curl -I http://localhost/
4. 显示服务访问地址
5. 显示默认登录信息（admin/admin123）
```

## 阶段 9：配置防火墙

```
请帮我配置防火墙：
1. 检测系统使用的防火墙（ufw 或 firewall-cmd）
2. 开放 SSH 端口 22
3. 开放 HTTP 端口 80
4. 开放 HTTPS 端口 443
5. 显示防火墙状态
6. 提醒用户如果需要直接访问后端，开放 3000 端口（生产环境不推荐）
```

## 阶段 10：设置自动启动

```
请帮我设置容器自动启动：
1. 检查所有容器的 restart 策略
2. 确保 restart 策略为 unless-stopped
3. 如果不是，更新 docker-compose.yml 并重启
4. 验证设置是否生效
```

## 阶段 11：创建备份脚本

```
请帮我创建数据库备份脚本：
1. 创建 backup.sh 文件
2. 脚本功能：备份 MySQL 数据库到 backups 目录
3. 使用时间戳命名备份文件
4. 自动删除 7 天前的备份
5. 设置脚本可执行权限
6. 显示备份脚本使用方法
```

## 阶段 12：设置定时备份

```
请帮我设置定时数据库备份：
1. 创建 crontab 任务，每天凌晨 2 点执行备份
2. 备份命令：/opt/bid-management-system/backup.sh
3. 将备份日志输出到 backups/backup.log
4. 显示 crontab 任务列表
```

## 故障排查指令

```
请帮我排查服务问题：
1. 显示所有容器状态
2. 显示每个容器的最近 50 行日志
3. 检查容器资源使用情况（docker stats）
4. 检查磁盘空间使用
5. 检查内存使用
6. 如果有容器异常退出，分析原因
```

## 更新部署指令

```
请帮我更新部署：
1. 拉取最新代码：git pull
2. 停止现有容器：docker compose down
3. 重新构建镜像：docker compose build
4. 启动服务：docker compose up -d
5. 验证服务正常
6. 如果数据库有迁移，执行迁移脚本
```

## 完全清理指令

```
请帮我完全清理 Docker 环境：
1. 停止所有容器：docker compose down
2. 删除所有数据卷：docker compose down -v
3. 删除构建的镜像
4. 询问用户是否确认（重要！）
```
