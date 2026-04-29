<template>
  <el-dialog
    v-model="visible"
    :title="subscription ? '编辑订阅' : '新建订阅'"
    width="600px"
  >
    <el-form :model="form" label-width="120px">
      <el-form-item label="订阅名称">
        <el-input v-model="form.name" placeholder="请输入订阅名称" />
      </el-form-item>

      <el-form-item label="报表模板">
        <el-select v-model="form.templateId" placeholder="选择模板" :disabled="!!subscription">
          <el-option
            v-for="tpl in templates"
            :key="tpl.id"
            :label="tpl.name"
            :value="tpl.id"
          />
        </el-select>
      </el-form-item>

      <el-form-item label="执行计划">
        <el-select v-model="form.schedule" placeholder="选择计划">
          <el-option label="每天" value="daily" />
          <el-option label="每周" value="weekly" />
          <el-option label="每月" value="monthly" />
        </el-select>
      </el-form-item>

      <el-form-item label="执行时间">
        <el-time-picker
          v-model="scheduleTime"
          format="HH:mm"
          value-format="HH:mm"
          placeholder="选择时间"
        />
      </el-form-item>

      <el-form-item label="接收人邮箱">
        <el-input v-model="recipientsInput" type="textarea" placeholder="多个邮箱用逗号分隔" />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="handleConfirm" :loading="loading">
        确定
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { reportApi } from '@/api/report'
import type { ReportSubscription, ReportTemplate } from '@/types/report'

interface Props {
  modelValue: boolean
  subscription?: ReportSubscription | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const visible = ref(false)
const loading = ref(false)
const templates = ref<ReportTemplate[]>([])
const scheduleTime = ref('')

const form = reactive({
  name: '',
  templateId: '',
  schedule: 'daily' as any,
  scheduleTime: '09:00',
  recipients: [] as string[],
})

const recipientsInput = computed({
  get: () => form.recipients.join(', '),
  set: (val: string) => {
    form.recipients = val.split(',').map(s => s.trim()).filter(s => s)
  },
})

watch(() => props.modelValue, async (val) => {
  visible.value = val
  if (val) {
    // 加载模板列表
    templates.value = await reportApi.getTemplates()
    if (props.subscription) {
      Object.assign(form, {
        name: props.subscription.name,
        templateId: props.subscription.templateId,
        schedule: props.subscription.schedule,
        scheduleTime: props.subscription.scheduleTime,
        recipients: props.subscription.recipients,
      })
      scheduleTime.value = props.subscription.scheduleTime
    }
  }
})

watch(visible, (val) => {
  emit('update:modelValue', val)
  if (!val) {
    resetForm()
  }
})

async function handleConfirm() {
  if (!form.name) {
    ElMessage.warning('请输入订阅名称')
    return
  }
  if (!form.templateId) {
    ElMessage.warning('请选择报表模板')
    return
  }
  if (form.recipients.length === 0) {
    ElMessage.warning('请输入接收人邮箱')
    return
  }

  loading.value = true
  try {
    const dto = {
      ...form,
      scheduleTime: scheduleTime.value || form.scheduleTime,
    }
    if (props.subscription) {
      await reportApi.updateSubscription(props.subscription.id, dto)
      ElMessage.success('更新成功')
    } else {
      await reportApi.createSubscription(dto)
      ElMessage.success('创建成功')
    }
    emit('success')
    visible.value = false
  } catch (error) {
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  form.name = ''
  form.templateId = ''
  form.schedule = 'daily'
  form.scheduleTime = '09:00'
  form.recipients = []
  scheduleTime.value = ''
}
</script>
