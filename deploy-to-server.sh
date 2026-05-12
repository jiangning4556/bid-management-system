#!/bin/bash
# ==============================================
# 从本地部署到服务器的脚本
# ==============================================

set -e

# ============================================
# 配置区域 - 请修改为你的实际值
# ============================================

# 服务器信息
SERVER_USER="your-username"          # 服务器用户名
SERVER_HOST="your-server-ip"          # 服务器 IP 或域名
SERVER_PATH="/opt/bid-management-system"  # 服务器上的项目路径

# Git 仓库信息（如果使用 Git 部署）
GIT_REPO=""                           # 留空则使用 SCP 上传
# 例如: GIT_REPO="https://github.com/username/repo.git"

# ============================================
# 颜色定义
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# ============================================
# 检查本地环境
# ============================================
check_local() {
    log_info "检查本地环境..."

    # 检查是否在项目根目录
    if [ ! -f "docker-compose.yml" ]; then
        log_error "请在项目根目录运行此脚本"
        exit 1
    fi

    # 检查必要的文件
    local required_files=(
        "docker-compose.yml"
        "backend/Dockerfile"
        "frontend2/Dockerfile"
        ".env.example"
    )

    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            log_error "缺少必要文件: $file"
            exit 1
        fi
    done

    log_success "本地环境检查通过"
}

# ============================================
# 使用 Git 部署
# ============================================
deploy_via_git() {
    log_info "使用 Git 方式部署..."

    # 检查是否已推送到远程仓库
    if [ -z "$GIT_REPO" ]; then
        log_error "请先在脚本中配置 GIT_REPO 变量"
        exit 1
    fi

    # 推送代码
    log_info "推送代码到远程仓库..."
    git add -A
    git commit -m "Deploy to server - $(date +%Y%m%d_%H%M%S)" || true
    git push

    # 在服务器上拉取并部署
    log_info "在服务器上拉取代码并部署..."
    ssh "$SERVER_USER@$SERVER_HOST" << ENDSSH
        set -e

        # 创建项目目录
        sudo mkdir -p $SERVER_PATH
        cd $SERVER_PATH

        # 如果是首次部署，克隆仓库
        if [ ! -d ".git" ]; then
            sudo git clone $GIT_REPO .
            sudo chown -R $USER:$USER $SERVER_PATH
        else
            # 拉取最新代码
            git pull
        fi

        # 运行部署脚本
        chmod +x deploy.sh
        ./deploy.sh
ENDSSH

    log_success "Git 部署完成"
}

# ============================================
# 使用 SCP 部署
# ============================================
deploy_via_scp() {
    log_info "使用 SCP 方式部署..."

    # 创建临时打包文件
    local TEMP_FILE="/tmp/bid-management-$(date +%Y%m%d_%H%M%S).tar.gz"

    log_info "打包项目文件..."
    tar --exclude=node_modules \
        --exclude=.git \
        --exclude=dist \
        --exclude=logs \
        --exclude=uploads \
        --exclude=backups \
        --exclude='*.log' \
        -czf "$TEMP_FILE" .

    log_info "上传到服务器..."
    scp "$TEMP_FILE" "$SERVER_USER@$SERVER_HOST:/tmp/"

    log_info "在服务器上解压并部署..."
    ssh "$SERVER_USER@$SERVER_HOST" << ENDSSH
        set -e

        # 创建项目目录
        sudo mkdir -p $SERVER_PATH
        cd $SERVER_PATH

        # 备份现有文件（如果存在）
        if [ -f ".env" ]; then
            sudo cp .env .env.backup
        fi

        # 解压新文件
        sudo tar -xzf /tmp/$(basename $TEMP_FILE) -C $SERVER_PATH

        # 恢复环境配置
        if [ -f ".env.backup" ]; then
            sudo mv .env.backup .env
        fi

        # 修复权限
        sudo chown -R $USER:$USER $SERVER_PATH

        # 删除临时文件
        rm /tmp/$(basename $TEMP_FILE)

        # 运行部署脚本
        chmod +x deploy.sh
        ./deploy.sh
ENDSSH

    # 删除本地临时文件
    rm "$TEMP_FILE"

    log_success "SCP 部署完成"
}

# ============================================
# 在服务器上执行 Claude Code 部署
# ============================================
deploy_with_claude() {
    log_info "在服务器上使用 Claude Code 部署..."

    # 先上传代码
    if [ -n "$GIT_REPO" ]; then
        deploy_via_git
    else
        deploy_via_scp
    fi

    # 在服务器上启动 Claude Code
    log_warning "请在服务器上手动运行以下命令："
    echo ""
    echo "  ssh $SERVER_USER@$SERVER_HOST"
    echo "  cd $SERVER_PATH"
    echo "  claude"
    echo ""
    echo "然后按照 CLAUDE_DEPLOY.md 中的指令逐步执行部署"
}

# ============================================
# 主函数
# ============================================
main() {
    echo ""
    log_info "========================================"
    log_info "投标管理系统 - 部署到服务器"
    log_info "========================================"
    echo ""

    # 检查配置
    if [ "$SERVER_USER" = "your-username" ] || [ "$SERVER_HOST" = "your-server-ip" ]; then
        log_error "请先配置脚本中的服务器信息："
        echo "  - SERVER_USER: 服务器用户名"
        echo "  - SERVER_HOST: 服务器 IP 或域名"
        exit 1
    fi

    check_local

    # 选择部署方式
    echo ""
    log_info "请选择部署方式："
    echo "  1) Git 部署（需要配置 Git 仓库）"
    echo "  2) SCP 部署（直接上传文件）"
    echo "  3) 仅上传代码，手动使用 Claude Code 部署"
    echo ""
    read -p "请输入选项 (1-3): " choice

    case $choice in
        1)
            if [ -z "$GIT_REPO" ]; then
                log_error "请先配置 GIT_REPO 变量"
                exit 1
            fi
            deploy_via_git
            ;;
        2)
            deploy_via_scp
            ;;
        3)
            if [ -n "$GIT_REPO" ]; then
                deploy_via_git
            else
                deploy_via_scp
            fi
            deploy_with_claude
            ;;
        *)
            log_error "无效的选项"
            exit 1
            ;;
    esac

    echo ""
    log_success "========================================"
    log_success "部署完成！"
    log_success "========================================"
    echo ""
    log_info "访问地址："
    echo "  http://$SERVER_HOST"
    echo ""
    log_warning "默认账户：admin / admin123"
    echo ""
}

# 执行主函数
main "$@"
