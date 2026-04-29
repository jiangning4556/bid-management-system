<template>
  <div class="profile-container page-container">
    <el-card>
      <template #header>
        <span>个人资料</span>
      </template>

      <el-tabs v-model="activeTab">
        <!-- Basic Info -->
        <el-tab-pane label="基本信息" name="basic">
          <el-form
            ref="formRef"
            :model="formData"
            :rules="rules"
            label-width="100px"
            class="profile-form"
            style="max-width: 600px"
          >
            <el-form-item label="用户名">
              <el-input v-model="formData.username" disabled />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="formData.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="formData.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleUpdate" :loading="updating">
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <!-- Change Password -->
        <el-tab-pane label="修改密码" name="password">
          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
            class="profile-form"
            style="max-width: 600px"
          >
            <el-form-item label="原密码" prop="oldPassword">
              <el-input
                v-model="passwordForm.oldPassword"
                type="password"
                placeholder="请输入原密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleChangePassword" :loading="changingPassword">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, type FormInstance, type FormRules } from 'element-plus'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const activeTab = ref('basic')
const updating = ref(false)
const changingPassword = ref(false)
const formRef = ref<FormInstance>()
const passwordFormRef = ref<FormInstance>()

const formData = reactive({
  username: '',
  email: '',
  phone: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const rules: FormRules = {
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' },
  ],
  phone: [
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' },
  ],
}

const validateConfirmPassword = (_rule: any, value: string, callback: any) => {
  if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules: FormRules = {
  oldPassword: [
    { required: true, message: '请输入原密码', trigger: 'blur' },
  ],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, max: 20, message: '密码长度在 6 到 20 个字符', trigger: 'blur' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

async function loadProfile() {
  try {
    const user = await userStore.getProfile()
    formData.username = user.username
    formData.email = user.email || ''
    formData.phone = user.phone || ''
  } catch (error) {
    // Error handled by interceptor
  }
}

async function handleUpdate() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    updating.value = true
    try {
      await userStore.updateProfile({
        email: formData.email || undefined,
        phone: formData.phone || undefined,
      })
      ElMessage.success('保存成功')
    } catch (error) {
      // Error handled by interceptor
    } finally {
      updating.value = false
    }
  })
}

async function handleChangePassword() {
  if (!passwordFormRef.value) return

  await passwordFormRef.value.validate(async (valid) => {
    if (!valid) return

    changingPassword.value = true
    try {
      await userStore.changePassword(passwordForm.oldPassword, passwordForm.newPassword)
      ElMessage.success('密码修改成功，请重新登录')

      // Reset form
      Object.assign(passwordForm, {
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      })

      // Logout after password change
      setTimeout(() => {
        userStore.logout()
        window.location.href = '/login'
      }, 1000)
    } catch (error) {
      // Error handled by interceptor
    } finally {
      changingPassword.value = false
    }
  })
}

onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-form {
  margin-top: 20px;
}
</style>
