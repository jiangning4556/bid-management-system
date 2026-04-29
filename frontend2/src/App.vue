<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue'

onMounted(() => {
  // Check if user is logged in on app mount
  const token = localStorage.getItem('token')
  if (!token && window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.page-container {
  padding: 20px;
  min-height: calc(100vh - 120px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex {
  display: flex;
}

.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.flex-gap {
  display: flex;
  gap: 10px;
}

.mb-16 {
  margin-bottom: 16px;
}

.mb-20 {
  margin-bottom: 20px;
}

.mt-16 {
  margin-top: 16px;
}

.mr-8 {
  margin-right: 8px;
}

.full-width {
  width: 100%;
}

.text-center {
  text-align: center;
}

.text-right {
  text-align: right;
}

.font-bold {
  font-weight: bold;
}

.text-primary {
  color: #409eff;
}

.text-success {
  color: #67c23a;
}

.text-warning {
  color: #e6a23c;
}

.text-danger {
  color: #f56c6c;
}

.text-info {
  color: #909399;
}
</style>
