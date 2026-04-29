import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  EXPORT = 'export',
  IMPORT = 'import',
}

export enum TargetType {
  USER = 'user',
  SUPPLIER = 'supplier',
  CATEGORY = 'category',
  ITEM = 'item',
  CONSULT_PROJECT = 'consult_project',
  BID_PROJECT = 'bid_project',
  PAYMENT = 'payment',
  RECEIPT = 'receipt',
  FILE = 'file',
}

@Entity('operation_logs')
export class OperationLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: OperationType,
  })
  operationType: OperationType;

  @Column({
    type: 'enum',
    enum: TargetType,
  })
  targetType: TargetType;

  @Column()
  targetId: string;

  @Column({ type: 'json', nullable: true })
  content: Record<string, any>;

  @Column({ nullable: true })
  ip: string;

  @Column({ nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;
}
