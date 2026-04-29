import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  userId: string;

  // 通知类型开关
  @Column({ default: true })
  projectNotify: boolean;

  @Column({ default: true })
  paymentNotify: boolean;

  @Column({ default: true })
  receiptNotify: boolean;

  @Column({ default: true })
  supplierNotify: boolean;

  @Column({ default: true })
  systemNotify: boolean;

  // 通知声音
  @Column({ default: true })
  enableSound: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
