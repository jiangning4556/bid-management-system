import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BidProject } from '../../bid-project/entities/bid-project.entity';

export enum InvoiceStatus {
  NOT_INVOICED = 'not_invoiced',
  INVOICED = 'invoiced',
}

@Entity('receipt_records')
export class ReceiptRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  projectId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Index()
  @Column({ type: 'date' })
  receiptTime: Date;

  @Column({ nullable: true })
  receiptMethod: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  ratio: number;

  @Index()
  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.NOT_INVOICED,
  })
  invoiceStatus: InvoiceStatus;

  @Column({ type: 'date', nullable: true })
  invoiceTime: Date;

  @Column({ nullable: true })
  invoiceType: string;

  @Column({ nullable: true })
  invoiceNo: string;

  @Column({ type: 'date', nullable: true })
  estimatedPaymentTime: Date;

  // 提醒记录：记录各阶段提醒的最后发送日期
  // 格式：{ "7days": "2024-03-08", "3days": "2024-03-12", "1day": "2024-03-14" }
  @Column({ type: 'json', nullable: true })
  reminderLog: Record<string, string>;

  @Column({ default: false })
  isCompleted: boolean;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ nullable: true })
  proofUrl: string;

  @Index()
  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => BidProject, project => project.receipts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: BidProject;
}
