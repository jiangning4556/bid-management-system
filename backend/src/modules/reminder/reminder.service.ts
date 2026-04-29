import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { ReceiptRecord } from '../payment/entities/receipt-record.entity';
import { BidProject } from '../bid-project/entities/bid-project.entity';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/entities/notification.entity';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(
    @InjectRepository(ReceiptRecord)
    private receiptRecordRepository: Repository<ReceiptRecord>,
    @InjectRepository(BidProject)
    private bidProjectRepository: Repository<BidProject>,
    private notificationService: NotificationService,
  ) {}

  /**
   * 每天早上9点执行收款提醒检查
   * 检查即将到期的收款记录（提前7天、3天、1天）
   */
  @Cron(CronExpression.EVERY_DAY_AT_9AM)
  async checkReceiptReminders() {
    this.logger.log('[Reminder] Starting daily receipt reminder check...');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayStr = today.toISOString().split('T')[0];

    // 定义提醒阶段：提前天数和对应的标识
    const reminderStages = [
      { days: 7, key: '7days', label: '7天' },
      { days: 3, key: '3days', label: '3天' },
      { days: 1, key: '1day', label: '1天' },
    ];

    let totalNotified = 0;

    for (const stage of reminderStages) {
      // 计算目标日期
      const targetDate = new Date(today);
      targetDate.setDate(targetDate.getDate() + stage.days);
      const targetDateStr = targetDate.toISOString().split('T')[0];

      // 查找在目标日期需要付款的收款记录
      const receiptsToRemind = await this.receiptRecordRepository
        .createQueryBuilder('receipt')
        .leftJoinAndSelect('receipt.project', 'project')
        .where('receipt.estimatedPaymentTime = :targetDate', { targetDate: targetDateStr })
        .andWhere('receipt.isCompleted = :isCompleted', { isCompleted: false })
        .getMany();

      this.logger.log(`[Reminder] Found ${receiptsToRemind.length} receipts due in ${stage.label}`);

      for (const receipt of receiptsToRemind) {
        // 初始化 reminderLog
        if (!receipt.reminderLog) {
          receipt.reminderLog = {};
        }

        // 检查今天是否已经发送过此阶段的提醒
        const lastReminderDate = receipt.reminderLog[stage.key];
        if (lastReminderDate === todayStr) {
          continue; // 今天已提醒，跳过
        }

        // 发送提醒通知
        await this.sendReminderNotification(receipt, stage.days);

        // 更新提醒记录
        receipt.reminderLog[stage.key] = todayStr;
        await this.receiptRecordRepository.save(receipt);

        totalNotified++;
      }
    }

    if (totalNotified > 0) {
      this.logger.log(`[Reminder] Sent ${totalNotified} receipt reminders`);
    } else {
      this.logger.log('[Reminder] No new receipts to remind');
    }
  }

  /**
   * 发送提醒通知
   */
  private async sendReminderNotification(receipt: ReceiptRecord, daysUntilDue: number) {
    const project = receipt.project || await this.bidProjectRepository.findOne({
      where: { id: receipt.projectId },
    });

    if (!project) {
      this.logger.warn(`[Reminder] Project not found for receipt ${receipt.id}`);
      return;
    }

    const title = daysUntilDue === 1
      ? '收款提醒：明日到期'
      : `收款提醒：${daysUntilDue}天后到期`;

    const content = `项目"${project.name}"的收款 ¥${receipt.amount}将于${daysUntilDue}天后到期（${receipt.estimatedPaymentTime}）`;

    await this.notificationService.create({
      userId: receipt.userId,
      type: NotificationType.RECEIPT,
      title,
      content,
      relatedId: receipt.id,
      relatedType: 'ReceiptRecord',
      metadata: {
        amount: receipt.amount,
        projectName: project.name,
        projectId: project.id,
        estimatedPaymentTime: receipt.estimatedPaymentTime,
        daysUntilDue,
      },
    });

    this.logger.log(`[Reminder] Notification sent to user ${receipt.userId} for receipt ${receipt.id}`);
  }

  /**
   * 手动触发提醒检查（用于测试）
   */
  async manualCheck() {
    this.logger.log('[Reminder] Manual reminder check triggered');
    await this.checkReceiptReminders();
  }
}
