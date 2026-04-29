<template>
  <el-dialog
    :model-value="visible"
    title="编辑物品"
    width="500px"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      label-width="100px"
      @submit.prevent="$emit('submit', formData)"
    >
      <el-form-item label="物品名称">
        <el-input :value="itemName" disabled />
      </el-form-item>
      <el-form-item label="数量" prop="quantity">
        <el-input-number
          v-model="formData.quantity"
          :min="1"
          :precision="0"
          style="width: 100%"
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
import { computed, reactive, ref, watch } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import type { ConsultProjectItem } from '@/types'

interface Props {
  visible: boolean
  item: ConsultProjectItem | null
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
  quantity: 1,
  remarks: '',
})

const rules: FormRules = {
  quantity: [
    { required: true, message: '请输入数量', trigger: 'blur' },
    { type: 'number', min: 1, message: '数量必须大于0', trigger: 'blur' },
  ],
}

const itemName = computed(() => props.item?.item?.name || '')

watch(() => props.item, (item) => {
  if (item) {
    formData.quantity = item.quantity
    formData.remarks = item.remarks || ''
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
