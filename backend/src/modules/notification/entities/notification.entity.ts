import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Exclude } from 'class-transformer';

export enum NotificationType {
  PROJECT = 'PROJECT',
  PAYMENT = 'PAYMENT',
  RECEIPT = 'RECEIPT',
  SUPPLIER = 'SUPPLIER',
  SYSTEM = 'SYSTEM',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ nullable: true })
  relatedId: string;

  @Column({ nullable: true })
  relatedType: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  @Exclude({ toPlainOnly: true })
  user: User;
}
