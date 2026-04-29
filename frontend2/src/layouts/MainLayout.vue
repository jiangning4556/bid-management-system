<template>
  <el-container class="layout-container">
    <el-aside width="200px" class="sidebar">
      <div class="logo">
        <h2>投标管理系统</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="sidebar-menu"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>工作台</span>
        </el-menu-item>
        <el-menu-item index="/suppliers">
          <el-icon><OfficeBuilding /></el-icon>
          <span>供应商管理</span>
        </el-menu-item>
        <el-sub-menu index="material">
          <template #title>
            <el-icon><Box /></el-icon>
            <span>物料库</span>
          </template>
          <el-menu-item index="/categories">分类管理</el-menu-item>
          <el-menu-item index="/items">物品管理</el-menu-item>
        </el-sub-menu>
        <el-menu-item index="/consult-projects">
          <el-icon><Document /></el-icon>
          <span>咨询项目</span>
        </el-menu-item>
        <el-menu-item index="/bid-projects">
          <el-icon><Select /></el-icon>
          <span>中标项目</span>
        </el-menu-item>
        <el-menu-item index="/payments">
          <el-icon><Money /></el-icon>
          <span>付款管理</span>
        </el-menu-item>
        <el-menu-item index="/price-query">
          <el-icon><Search /></el-icon>
          <span>价格查询</span>
        </el-menu-item>
        <el-menu-item index="/statistics">
          <el-icon><DataAnalysis /></el-icon>
          <span>统计分析</span>
        </el-menu-item>
        <el-menu-item index="/reports">
          <el-icon><Document /></el-icon>
          <span>报表系统</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item v-if="currentPage">{{ currentPage }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <NotificationBell />
          <el-dropdown @command="handleCommand">
            <span class="user-dropdown">
              <el-avatar :size="32" :src="userStore.user?.avatar">
                {{ userStore.user?.username?.charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="username">{{ userStore.user?.username }}</span>
              <el-tag v-if="userStore.isAdmin" type="danger" size="small" class="admin-tag">
                管理员
              </el-tag>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">
                  <el-icon><User /></el-icon>
                  个人资料
                </el-dropdown-item>
                <el-dropdown-item command="logout" divided>
                  <el-icon><SwitchButton /></el-icon>
                  退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import NotificationBell from '@/components/NotificationBell.vue'
import { useWebSocket } from '@/composables/useNotification'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const activeMenu = computed(() => {
  const path = route.path
  if (path.startsWith('/consult-projects/') && path !== '/consult-projects') {
    return '/consult-projects'
  }
  if (path.startsWith('/bid-projects/') && path !== '/bid-projects') {
    return '/bid-projects'
  }
  return path
})

const currentPage = computed(() => {
  const routeMap: Record<string, string> = {
    '/dashboard': '工作台',
    '/suppliers': '供应商管理',
    '/categories': '分类管理',
    '/items': '物品管理',
    '/consult-projects': '咨询项目',
    '/bid-projects': '中标项目',
    '/payments': '付款管理',
    '/price-query': '价格查询',
    '/statistics': '统计分析',
    '/reports': '报表系统',
    '/profile': '个人资料',
    '/notifications': '通知中心',
    '/notifications/settings': '通知设置',
  }
  return routeMap[route.path] || ''
})

// WebSocket连接
const { connect, disconnect } = useWebSocket()

onMounted(() => {
  // 用户登录后自动连接WebSocket
  if (userStore.isLoggedIn) {
    connect()
  }
})

onUnmounted(() => {
  disconnect()
})

function handleMenuSelect(index: string) {
  router.push(index)
}

async function handleCommand(command: string) {
  if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      })
      userStore.logout()
      router.push('/login')
    } catch {
      // User cancelled
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #304156;
  overflow-x: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid #1f2d3d;
}

.sidebar-menu {
  border: none;
  background-color: #304156;
}

.sidebar-menu:not(.el-menu--collapse) {
  width: 200px;
}

/* Top level menu items and submenu titles */
.sidebar-menu > .el-menu-item,
.sidebar-menu > .el-sub-menu > .el-sub-menu__title {
  color: #bfcbd9 !important;
  background-color: transparent !important;
}

/* Ensure submenu title span text is also colored */
.sidebar-menu > .el-sub-menu > .el-sub-menu__title span {
  color: #bfcbd9 !important;
}

/* Hover states - ALL text elements must change to white */
.sidebar-menu > .el-menu-item:hover {
  background-color: #263445 !important;
  color: #fff !important;
}

.sidebar-menu > .el-menu-item:hover * {
  color: #fff !important;
}

/* Material library (submenu) hover - dark gray background */
.sidebar-menu > .el-sub-menu > .el-sub-menu__title:hover {
  background-color: #263445 !important;
  color: #fff !important;
}

.sidebar-menu > .el-sub-menu > .el-sub-menu__title:hover *,
.sidebar-menu > .el-sub-menu > .el-sub-menu__title:hover .el-sub-menu__icon-arrow {
  color: #fff !important;
}

/* Active states */
.sidebar-menu > .el-menu-item.is-active {
  background-color: #409eff !important;
}

.sidebar-menu > .el-menu-item.is-active * {
  color: #fff !important;
}

/* Submenu popup styles */
.el-menu--popup {
  background-color: #1f2d3d !important;
  min-width: 200px !important;
}

.el-menu--popup .el-menu-item {
  color: #bfcbd9 !important;
  background-color: #1f2d3d !important;
}

.el-menu--popup .el-menu-item:hover {
  background-color: #263445 !important;
  color: #fff !important;
}

.el-menu--popup .el-menu-item:hover * {
  color: #fff !important;
}

.el-menu--popup .el-menu-item.is-active {
  background-color: #409eff !important;
  color: #fff !important;
}

.el-menu--popup .el-menu-item.is-active * {
  color: #fff !important;
}

/* Nested menu items (submenu children) */
.sidebar-menu .el-sub-menu .el-menu {
  background-color: #1f2d3d;
}

.sidebar-menu .el-sub-menu .el-menu-item {
  color: #bfcbd9;
  background-color: #1f2d3d;
  min-width: 200px;
}

.sidebar-menu .el-sub-menu .el-menu-item:hover {
  background-color: #263445;
  color: #fff;
}

.sidebar-menu .el-sub-menu .el-menu-item.is-active {
  background-color: #409eff !important;
  color: #fff;
}

.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-dropdown {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.user-dropdown:hover {
  background-color: #f5f7fa;
}

.username {
  font-size: 14px;
  color: #333;
}

.admin-tag {
  margin-left: 4px;
}

.main-content {
  background-color: #f0f2f5;
  overflow-y: auto;
}
</style>
