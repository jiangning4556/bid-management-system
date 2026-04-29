import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem('token'))
  const user = ref<User | null>(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')

  async function login(username: string, password: string) {
    const response = await authApi.login({ username, password })
    if (response.access_token && response.user) {
      token.value = response.access_token
      user.value = response.user
      localStorage.setItem('token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
      return true
    }
    return false
  }

  async function register(data: { username: string; password: string; email?: string; phone?: string }) {
    const response = await authApi.register(data)
    return response
  }

  async function getProfile() {
    try {
      const userData = await authApi.getProfile()
      user.value = userData
      localStorage.setItem('user', JSON.stringify(userData))
      return userData
    } catch (error) {
      throw error
    }
  }

  async function updateProfile(data: Partial<User>) {
    const userData = await authApi.updateProfile(data)
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
    return userData
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    await authApi.changePassword(oldPassword, newPassword)
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return {
    token,
    user,
    isLoggedIn,
    isAdmin,
    login,
    register,
    getProfile,
    updateProfile,
    changePassword,
    logout,
  }
})
