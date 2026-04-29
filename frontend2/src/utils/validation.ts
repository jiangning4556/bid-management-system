import type { FormRule } from 'element-plus'

/**
 * 统一表单验证规则
 * 消除跨组件的重复验证代码
 */

/**
 * 必填验证规则
 * @param message 错误提示信息
 * @param trigger 触发方式
 */
export function requiredRule(message: string, trigger: 'blur' | 'change' = 'blur'): FormRule {
  return { required: true, message, trigger }
}

/**
 * 名称验证规则
 */
export const nameRule = requiredRule('请输入名称')

/**
 * 项目名称验证规则
 */
export const projectNameRule = requiredRule('请输入项目名称')

/**
 * 项目编号验证规则
 */
export const projectCodeRule = requiredRule('请输入项目编号')

/**
 * 客户名称验证规则
 */
export const customerRule = requiredRule('请输入客户名称')

/**
 * 手机号验证规则
 */
export const phoneRule: FormRule = {
  pattern: /^1[3-9]\d{9}$/,
  message: '请输入正确的手机号码',
  trigger: 'blur',
}

/**
 * 邮箱验证规则
 */
export const emailRule: FormRule = {
  type: 'email',
  message: '请输入正确的邮箱地址',
  trigger: 'blur',
}

/**
 * 正数验证规则（用于金额、单价等）
 * @param field 字段名称
 */
export function positiveNumberRule(field: string): FormRule {
  return {
    type: 'number',
    min: 0.01,
    message: `${field}必须大于0`,
    trigger: 'blur',
  }
}

/**
 * 数量验证规则
 */
export const quantityRule: FormRule = {
  type: 'number',
  min: 1,
  message: '数量必须大于0',
  trigger: 'blur',
}

/**
 * 单价验证规则
 */
export const priceRule = positiveNumberRule('单价')

/**
 * 金额验证规则
 */
export const amountRule = positiveNumberRule('金额')

/**
 * 供应商选择验证规则
 */
export const supplierRule = requiredRule('请选择供应商', 'change')

/**
 * 物品选择验证规则
 */
export const itemRule = requiredRule('请选择物品', 'change')

/**
 * 分类选择验证规则
 */
export const categoryRule = requiredRule('请选择分类', 'change')

/**
 * 预定义的规则集合
 */
export const validationRules = {
  // 通用规则
  required: requiredRule,
  name: nameRule,
  projectName: projectNameRule,
  projectCode: projectCodeRule,
  customer: customerRule,
  phone: phoneRule,
  email: emailRule,
  positiveNumber: positiveNumberRule,

  // 业务规则
  quantity: quantityRule,
  price: priceRule,
  amount: amountRule,
  supplier: supplierRule,
  item: itemRule,
  category: categoryRule,
}

/**
 * 创建项目表单验证规则
 */
export const projectFormRules = {
  name: projectNameRule,
  projectCode: projectCodeRule,
  customer: customerRule,
}

/**
 * 供应商表单验证规则
 */
export const supplierFormRules = {
  name: nameRule,
  phone: phoneRule,
}

/**
 * 报价表单验证规则
 */
export const quoteFormRules = {
  supplierId: supplierRule,
  price: priceRule,
  quantity: quantityRule,
}

/**
 * 物品表单验证规则
 */
export const itemFormRules = {
  name: nameRule,
  categoryId: categoryRule,
}
