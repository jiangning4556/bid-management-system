import { describe, it, expect } from 'vitest'
import {
  CONSULT_PROJECT_STATUS,
  CONSULT_PROJECT_STATUS_TYPE,
  BID_PROJECT_STATUS,
  BID_PROJECT_STATUS_TYPE,
  SUPPLIER_PROGRESS_STATUS,
  SUPPLIER_PROGRESS_STATUS_TYPE,
  PAYMENT_STATUS,
  PAYMENT_STATUS_TYPE,
  INVOICE_STATUS,
  NOTIFICATION_TYPE,
  getConsultProjectStatusLabel,
  getConsultProjectStatusType,
  getBidProjectStatusLabel,
  getBidProjectStatusType,
  getSupplierProgressStatusLabel,
  getSupplierProgressStatusType,
  getPaymentStatusLabel,
  getPaymentStatusType,
} from './status'

describe('Consult Project Status', () => {
  describe('CONSULT_PROJECT_STATUS', () => {
    it('should have correct status labels', () => {
      expect(CONSULT_PROJECT_STATUS.consulting).toBe('咨询中')
      expect(CONSULT_PROJECT_STATUS.quoted).toBe('已报价')
      expect(CONSULT_PROJECT_STATUS.paused).toBe('已暂停')
      expect(CONSULT_PROJECT_STATUS.cancelled).toBe('已取消')
    })
  })

  describe('CONSULT_PROJECT_STATUS_TYPE', () => {
    it('should have correct element-plus types', () => {
      expect(CONSULT_PROJECT_STATUS_TYPE.consulting).toBe('primary')
      expect(CONSULT_PROJECT_STATUS_TYPE.quoted).toBe('success')
      expect(CONSULT_PROJECT_STATUS_TYPE.paused).toBe('warning')
      expect(CONSULT_PROJECT_STATUS_TYPE.cancelled).toBe('info')
    })
  })

  describe('getConsultProjectStatusLabel', () => {
    it('should return correct label for valid status', () => {
      expect(getConsultProjectStatusLabel('consulting')).toBe('咨询中')
      expect(getConsultProjectStatusLabel('quoted')).toBe('已报价')
    })

    it('should return original status for unknown values', () => {
      expect(getConsultProjectStatusLabel('unknown-status')).toBe('unknown-status')
    })

    it('should return - for undefined or null status', () => {
      expect(getConsultProjectStatusLabel()).toBe('-')
      expect(getConsultProjectStatusLabel(null)).toBe('-')
      expect(getConsultProjectStatusLabel(undefined)).toBe('-')
    })
  })

  describe('getConsultProjectStatusType', () => {
    it('should return correct type for valid status', () => {
      expect(getConsultProjectStatusType('consulting')).toBe('primary')
      expect(getConsultProjectStatusType('quoted')).toBe('success')
    })

    it('should return info for unknown status', () => {
      expect(getConsultProjectStatusType('unknown')).toBe('info')
    })
  })
})

describe('Bid Project Status', () => {
  describe('BID_PROJECT_STATUS', () => {
    it('should have correct status labels', () => {
      expect(BID_PROJECT_STATUS.preparing).toBe('准备中')
      expect(BID_PROJECT_STATUS.in_progress).toBe('进行中')
      expect(BID_PROJECT_STATUS.accepted).toBe('已验收')
      expect(BID_PROJECT_STATUS.completed).toBe('已结案')
    })
  })

  describe('BID_PROJECT_STATUS_TYPE', () => {
    it('should have correct element-plus types', () => {
      expect(BID_PROJECT_STATUS_TYPE.preparing).toBe('info')
      expect(BID_PROJECT_STATUS_TYPE.in_progress).toBe('primary')
      expect(BID_PROJECT_STATUS_TYPE.accepted).toBe('success')
      expect(BID_PROJECT_STATUS_TYPE.completed).toBe('')
    })
  })

  describe('getBidProjectStatusLabel', () => {
    it('should return correct label for valid status', () => {
      expect(getBidProjectStatusLabel('preparing')).toBe('准备中')
      expect(getBidProjectStatusLabel('in_progress')).toBe('进行中')
    })

    it('should return - for undefined status', () => {
      expect(getBidProjectStatusLabel()).toBe('-')
    })
  })

  describe('getBidProjectStatusType', () => {
    it('should return correct type for valid status', () => {
      expect(getBidProjectStatusType('in_progress')).toBe('primary')
      expect(getBidProjectStatusType('accepted')).toBe('success')
    })

    it('should return info for unknown status', () => {
      expect(getBidProjectStatusType('unknown')).toBe('info')
    })
  })
})

describe('Supplier Progress Status', () => {
  describe('SUPPLIER_PROGRESS_STATUS', () => {
    it('should have correct status labels', () => {
      expect(SUPPLIER_PROGRESS_STATUS.ordered).toBe('已下单')
      expect(SUPPLIER_PROGRESS_STATUS.producing).toBe('生产中')
      expect(SUPPLIER_PROGRESS_STATUS.shipped).toBe('已发货')
      expect(SUPPLIER_PROGRESS_STATUS.received).toBe('已收货')
      expect(SUPPLIER_PROGRESS_STATUS.completed).toBe('已完成')
    })
  })

  describe('SUPPLIER_PROGRESS_STATUS_TYPE', () => {
    it('should have correct element-plus types', () => {
      expect(SUPPLIER_PROGRESS_STATUS_TYPE.ordered).toBe('info')
      expect(SUPPLIER_PROGRESS_STATUS_TYPE.producing).toBe('primary')
      expect(SUPPLIER_PROGRESS_STATUS_TYPE.shipped).toBe('warning')
      expect(SUPPLIER_PROGRESS_STATUS_TYPE.received).toBe('success')
      expect(SUPPLIER_PROGRESS_STATUS_TYPE.completed).toBe('')
    })
  })

  describe('getSupplierProgressStatusLabel', () => {
    it('should return correct label for valid status', () => {
      expect(getSupplierProgressStatusLabel('ordered')).toBe('已下单')
      expect(getSupplierProgressStatusLabel('producing')).toBe('生产中')
    })

    it('should return - for undefined status', () => {
      expect(getSupplierProgressStatusLabel()).toBe('-')
    })
  })

  describe('getSupplierProgressStatusType', () => {
    it('should return correct type for valid status', () => {
      expect(getSupplierProgressStatusType('producing')).toBe('primary')
      expect(getSupplierProgressStatusType('shipped')).toBe('warning')
    })

    it('should return info for unknown status', () => {
      expect(getSupplierProgressStatusType('unknown')).toBe('info')
    })
  })
})

describe('Payment Status', () => {
  describe('PAYMENT_STATUS', () => {
    it('should have correct status labels', () => {
      expect(PAYMENT_STATUS.unpaid).toBe('未付款')
      expect(PAYMENT_STATUS.partial).toBe('部分付款')
      expect(PAYMENT_STATUS.paid).toBe('已付款')
    })
  })

  describe('PAYMENT_STATUS_TYPE', () => {
    it('should have correct element-plus types', () => {
      expect(PAYMENT_STATUS_TYPE.unpaid).toBe('danger')
      expect(PAYMENT_STATUS_TYPE.partial).toBe('warning')
      expect(PAYMENT_STATUS_TYPE.paid).toBe('success')
    })
  })

  describe('getPaymentStatusLabel', () => {
    it('should return correct label for valid status', () => {
      expect(getPaymentStatusLabel('unpaid')).toBe('未付款')
      expect(getPaymentStatusLabel('paid')).toBe('已付款')
    })

    it('should return - for undefined status', () => {
      expect(getPaymentStatusLabel()).toBe('-')
    })
  })

  describe('getPaymentStatusType', () => {
    it('should return correct type for valid status', () => {
      expect(getPaymentStatusType('unpaid')).toBe('danger')
      expect(getPaymentStatusType('paid')).toBe('success')
    })

    it('should return info for unknown status', () => {
      expect(getPaymentStatusType('unknown')).toBe('info')
    })
  })
})

describe('Other Status Constants', () => {
  describe('INVOICE_STATUS', () => {
    it('should have correct invoice status labels', () => {
      expect(INVOICE_STATUS.not_invoiced).toBe('未开票')
      expect(INVOICE_STATUS.invoiced).toBe('已开票')
    })
  })

  describe('NOTIFICATION_TYPE', () => {
    it('should have correct notification types', () => {
      expect(NOTIFICATION_TYPE.PROJECT).toBe('项目')
      expect(NOTIFICATION_TYPE.PAYMENT).toBe('付款')
      expect(NOTIFICATION_TYPE.RECEIPT).toBe('收款')
      expect(NOTIFICATION_TYPE.SUPPLIER).toBe('供应商')
      expect(NOTIFICATION_TYPE.SYSTEM).toBe('系统')
    })
  })
})
