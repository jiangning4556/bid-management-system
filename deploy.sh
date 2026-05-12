#!/bin/bash
# ==============================================
# 投标管理系统 Docker 部署脚本
# 配合 Claude Code 使用
# ==============================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查系统环境
check_environment() {
    log_info "检查系统环境..."

    # 检查 Docker
    if ! command_exists docker; then
        log_error "Docker 未安装，请先安装 Docker"
        log_info "安装命令: curl -fsSL https://get.docker.com | sh"
        exit 1
    fi
    log_success "Docker 已安装: $(docker --version)"

    # 检查 Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    log_success "Docker Compose 已安装"

    # 检查端口占用
    log_info "检查端口占用..."
    ports=(80 3000 3306 8080)
    for port in "${ports[@]}"; do
        if netstat -tuln 2>/dev/null | grep -q ":$port " || ss -tuln 2>/dev/null | grep -q ":$port "; then
            log_warning "端口 $port 已被占用"
        fi
    done
}

# 生成密钥
generate_secrets() {
    log_info "生成安全密钥..."

    if [ ! -f .env ]; then
        cp .env.example .env
        log_info "已创建 .env 文件"
    fi

    # 生成 MySQL 密码
    if grep -q "your-strong-password-change-me" .env; then
        MYSQL_ROOT_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
        MYSQL_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)

        sed -i "s/MYSQL_ROOT_PASSWORD=.*/MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD/" .env
        sed -i "s/MYSQL_PASSWORD=your-strong-password-change-me/MYSQL_PASSWORD=$MYSQL_PASSWORD/" .env

        log_success "已生成 MySQL 密码"
    fi

    # 生成 JWT 密钥
    if grep -q "your-jwt-secret-key-change-me" .env; then
        JWT_SECRET=$(openssl rand -base64 64)
        sed -i "s/JWT_SECRET=your-jwt-secret-key-change-me/JWT_SECRET=$JWT_SECRET/" .env
        log_success "已生成 JWT 密钥"
    fi

    # 保存密钥到安全文件
    cat > .env.secrets << EOF
# ==============================================
# 密钥备份 - 请妥善保管！
# 生成时间: $(date)
# ==============================================

MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
MYSQL_PASSWORD=$MYSQL_PASSWORD
JWT_SECRET=$JWT_SECRET
EOF

    chmod 600 .env.secrets
    log_warning "密钥已备份到 .env.secrets 文件，请妥善保管！"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."

    mkdir -p docker/mysql/conf.d
    mkdir -p docker/mysql/init
    mkdir -p docker/nginx/conf.d
    mkdir -p docker/nginx/ssl
    mkdir -p backend/logs
    mkdir -p backups

    log_success "目录创建完成"
}

# 配置防火墙
configure_firewall() {
    log_info "配置防火墙规则..."

    if command_exists ufw; then
        sudo ufw allow 22/tcp
        sudo ufw allow 80/tcp
        sudo ufw allow 443/tcp
        log_success "UFW 防火墙规则已配置"
    elif command_exists firewall-cmd; then
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --reload
        log_success "Firewalld 防火墙规则已配置"
    else
        log_warning "未检测到防火墙，请手动配置"
    fi
}

# 构建镜像
build_images() {
    log_info "开始构建 Docker 镜像..."

    # 使用 docker compose 或 docker-compose
    if docker compose version >/dev/null 2>&1; then
        docker compose build
    else
        docker-compose build
    fi

    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."

    # 使用 docker compose 或 docker-compose
    if docker compose version >/dev/null 2>&1; then
        docker compose up -d
    else
        docker-compose up -d
    fi

    log_success "服务已启动"
}

# 初始化数据库
init_database() {
    log_info "等待数据库启动..."
    sleep 15

    log_info "初始化数据库..."

    # 运行数据库迁移脚本
    if docker compose version >/dev/null 2>&1; then
        docker compose exec -T backend npm run migrate 2>/dev/null || true
    else
        docker-compose exec -T backend npm run migrate 2>/dev/null || true
    fi

    # 创建管理员账户
    if docker compose version >/dev/null 2>&1; then
        docker compose exec -T backend node scripts/create-admin.js 2>/dev/null || log_warning "管理员账户创建可能失败，请手动创建"
    else
        docker-compose exec -T backend node scripts/create-admin.js 2>/dev/null || log_warning "管理员账户创建可能失败，请手动创建"
    fi

    log_success "数据库初始化完成"
}

# 显示状态
show_status() {
    log_info "服务状态："

    if docker compose version >/dev/null 2>&1; then
        docker compose ps
    else
        docker-compose ps
    fi

    echo ""
    log_success "============================================="
    log_success "部署完成！"
    log_success "============================================="
    echo ""
    log_info "访问地址："
    echo "  - 前端: http://localhost"
    echo "  - 后端: http://localhost:3000"
    echo ""
    log_info "默认账户："
    echo "  - 用户名: admin"
    echo "  - 密码: admin123"
    echo ""
    log_warning "请立即修改默认密码！"
    echo ""
    log_info "常用命令："
    echo "  - 查看日志: docker compose logs -f"
    echo "  - 停止服务: docker compose down"
    echo "  - 重启服务: docker compose restart"
    echo "  - 更新服务: docker compose pull && docker compose up -d"
}

# 主函数
main() {
    echo ""
    log_info "============================================="
    log_info "投标管理系统 Docker 部署"
    log_info "============================================="
    echo ""

    # 检查是否在项目根目录
    if [ ! -f "docker-compose.yml" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi

    # 执行部署步骤
    check_environment
    create_directories
    generate_secrets
    configure_firewall
    build_images
    start_services
    init_database
    show_status

    # 创建备份脚本
    create_backup_script
}

# 创建备份脚本
create_backup_script() {
    cat > backup.sh << 'EOF'
#!/bin/bash
# 数据库备份脚本

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

echo "开始备份数据库..."

if docker compose version >/dev/null 2>&1; then
    docker compose exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} bid_management > $BACKUP_DIR/backup_${TIMESTAMP}.sql
else
    docker-compose exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} bid_management > $BACKUP_DIR/backup_${TIMESTAMP}.sql
fi

echo "备份完成: $BACKUP_DIR/backup_${TIMESTAMP}.sql"

# 删除 7 天前的备份
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

    chmod +x backup.sh
    log_success "备份脚本已创建: ./backup.sh"
}

# 执行主函数
main "$@"
