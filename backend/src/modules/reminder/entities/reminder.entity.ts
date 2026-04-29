import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum ReminderType {
  PAYMENT_DUE = 'payment_due',
  RECEIPT_DUE = 'receipt_due',
  INVOICE_DUE = 'invoice_due',
  PROJECT_MILESTONE = 'project_milestone',
  CONTRACT_EXPIRE = 'contract_expire',
}

export enum ReminderStatus {
  PENDING = 'pending',
  NOTIFIED = 'notified',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('reminders')
export class Reminder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: ReminderType,
  })
  type: ReminderType;

  @Column()
  targetId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'date' })
  remindDate: Date;

  @Column({ type: 'int', default: 3 })
  advanceDays: number;

  @Column({
    type: 'enum',
    enum: ReminderStatus,
    default: ReminderStatus.PENDING,
  })
  status: ReminderStatus;

  @Column({ default: false })
  isNotified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  notifiedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
