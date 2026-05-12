#!/bin/bash

# 投标管理系统 - 阿里云部署脚本
# 使用方法: ./deploy.sh [backend|frontend|all]

set -e

# 配置变量
PROJECT_DIR="/var/www/bid-management"
BACKUP_DIR="/var/backups/bid-management"
DATE=$(date +%Y%m%d_%H%M%S)

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查是否为 root 用户
check_root() {
    if [ "$EUID" -ne 0 ]; then
        log_error "请使用 root 用户或 sudo 执行此脚本"
        exit 1
    fi
}

# 备份当前版本
backup() {
    log_info "备份当前版本..."
    mkdir -p "$BACKUP_DIR"
    tar -czf "$BACKUP_DIR/backup_$DATE.tar.gz" -C "$PROJECT_DIR" . 2>/dev/null || true
    log_info "备份完成: $BACKUP_DIR/backup_$DATE.tar.gz"
}

# 部署后端
deploy_backend() {
    log_info "开始部署后端..."

    cd "$PROJECT_DIR/backend"

    # 安装依赖
    log_info "安装后端依赖..."
    npm ci --production

    # 构建项目
    log_info "构建后端项目..."
    npm run build

    # 重启 PM2
    log_info "重启后端服务..."
    if command -v pm2 &> /dev/null; then
        pm2 reload ecosystem.config.json --update-env
        pm2 save
    else
        log_warn "PM2 未安装，请手动启动服务"
    fi

    log_info "后端部署完成"
}

# 部署前端
deploy_frontend() {
    log_info "开始部署前端..."

    cd "$PROJECT_DIR/frontend2"

    # 安装依赖
    log_info "安装前端依赖..."
    npm ci

    # 构建项目
    log_info "构建前端项目..."
    npm run build

    # 复制构建文件
    log_info "部署前端文件..."
    rm -rf /var/www/bid-management/frontend
    mkdir -p /var/www/bid-management/frontend
    cp -r dist/* /var/www/bid-management/frontend/

    # 设置权限
    chown -R www-data:www-data /var/www/bid-management/frontend

    log_info "前端部署完成"
}

# 创建上传目录
create_upload_dirs() {
    log_info "创建上传目录..."
    mkdir -p /var/www/bid-management/uploads
    chown -R www-data:www-data /var/www/bid-management/uploads
    chmod -R 755 /var/www/bid-management/uploads
}

# 初始化数据库
init_database() {
    log_warn "数据库初始化..."
    cd "$PROJECT_DIR/backend"
    node scripts/create-database.js
    node scripts/create-admin.js
}

# 主函数
main() {
    check_root

    # 创建必要的目录
    mkdir -p "$PROJECT_DIR"
    mkdir -p /var/log/bid-management
    mkdir -p /var/backups/bid-management

    # 根据参数执行部署
    case "${1:-all}" in
        backend)
            backup
            deploy_backend
            ;;
        frontend)
            backup
            deploy_frontend
            ;;
        all)
            backup
            create_upload_dirs
            deploy_backend
            deploy_frontend
            ;;
        init-db)
            init_database
            ;;
        *)
            echo "使用方法: $0 [backend|frontend|all|init-db]"
            exit 1
            ;;
    esac

    log_info "部署完成！"

    # 显示服务状态
    if command -v pm2 &> /dev/null; then
        log_info "后端服务状态:"
        pm2 status
    fi

    log_info "Nginx 状态:"
    systemctl status nginx --no-pager
}

# 执行主函数
main "$@"
