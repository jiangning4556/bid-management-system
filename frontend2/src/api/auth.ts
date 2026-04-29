import request from '@/utils/request'
import type { LoginForm, RegisterForm, ApiResponse, User } from '@/types'

export const authApi = {
  // Login
  login(data: LoginForm) {
    return request.post<ApiResponse>('/auth/login', data)
  },

  // Register
  register(data: RegisterForm) {
    return request.post<ApiResponse>('/users/register', data)
  },

  // Logout
  logout() {
    return request.post<{ message: string }>('/auth/logout')
  },

  // Get current user profile
  getProfile() {
    return request.get<User>('/users/profile')
  },

  // Update profile
  updateProfile(data: Partial<User>) {
    return request.patch<User>('/users/profile', data)
  },

  // Change password
  changePassword(oldPassword: string, newPassword: string) {
    return request.post<{ message: string }>('/users/change-password', {
      oldPassword,
      newPassword,
    })
  },
}
