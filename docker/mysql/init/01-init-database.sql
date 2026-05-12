-- ==============================================
-- MySQL 初始化脚本
-- ==============================================

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS bid_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 创建用户（如果不存在）
CREATE USER IF NOT EXISTS 'biduser'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';

-- 授权
GRANT ALL PRIVILEGES ON bid_management.* TO 'biduser'@'%';
FLUSH PRIVILEGES;

-- 使用数据库
USE bid_management;

-- 注意：TypeORM 会在应用启动时自动创建表结构
-- 这里只放置一些初始化数据或配置
