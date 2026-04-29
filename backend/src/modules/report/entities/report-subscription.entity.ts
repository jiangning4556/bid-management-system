import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { ReportTemplate } from './report-template.entity';
import { User } from '../../user/entities/user.entity';

export type ScheduleType = 'daily' | 'weekly' | 'monthly';

@Entity('report_subscriptions')
export class ReportSubscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index()
  @Column()
  templateId: string;

  @Index()
  @Column()
  userId: string;

  @Column('json')
  recipients: string[];

  @Column({
    type: 'enum',
    enum: ['daily', 'weekly', 'monthly'],
  })
  schedule: ScheduleType;

  @Column({ type: 'time' })
  scheduleTime: string;

  @Column({ type: 'json', nullable: true })
  scheduleConfig: {
    dayOfWeek?: number;
    dayOfMonth?: number;
  };

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastRunAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  nextRunAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => ReportTemplate, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' })
  template: ReportTemplate;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
