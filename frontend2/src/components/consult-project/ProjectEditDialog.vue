<template>
  <el-dialog
    :model-value="visible"
    title="编辑项目信息"
    width="600px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      @submit.prevent="$emit('submit', formData)"
    >
      <el-form-item label="项目名称" prop="name">
        <el-input v-model="formData.name" placeholder="请输入项目名称" />
      </el-form-item>
      <el-form-item label="项目编号" prop="projectCode">
        <el-input v-model="formData.projectCode" placeholder="请输入项目编号" />
      </el-form-item>
      <el-form-item label="客户" prop="customer">
        <el-input v-model="formData.customer" placeholder="请输入客户名称" />
      </el-form-item>
      <el-form-item label="项目地址">
        <el-input v-model="formData.address" placeholder="请输入项目地址" />
      </el-form-item>
      <el-form-item label="咨询日期">
        <el-date-picker
          v-model="formData.consultDate"
          type="date"
          placeholder="选择咨询日期"
          style="width: 100%"
          value-format="YYYY-MM-DD"
        />
      </el-form-item>
      <el-form-item label="备注">
        <el-input
          v-model="formData.remarks"
          type="textarea"
          :rows="3"
          placeholder="请输入备注信息"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        保存
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ConsultProject } from '@/types'

interface Props {
  visible: boolean
  project: ConsultProject | null
  submitting: boolean
}

const props = defineProps<Props>()

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'submit', data: any): void
}

const emit = defineEmits<Emits>()

const formRef = ref<FormInstance>()

const formData = reactive({
  name: '',
  projectCode: '',
  customer: '',
  address: '',
  consultDate: '',
  remarks: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入项目名称', trigger: 'blur' }],
  projectCode: [{ required: true, message: '请输入项目编号', trigger: 'blur' }],
  customer: [{ required: true, message: '请输入客户', trigger: 'blur' }],
}

watch(() => props.project, (project) => {
  if (project) {
    Object.assign(formData, {
      name: project.name || '',
      projectCode: project.projectCode || '',
      customer: project.customer || '',
      address: project.address || '',
      consultDate: project.consultDate || '',
      remarks: project.remarks || '',
    })
  }
}, { immediate: true })

function handleSubmit() {
  formRef.value?.validate((valid) => {
    if (valid) {
      emit('submit', formData)
    }
  })
}

defineExpose({
  resetForm: () => formRef.value?.resetFields(),
})
</script>
