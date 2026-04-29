import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BidProjectItem } from './bid-project-item.entity';
import { Supplier } from '../../supplier/entities/supplier.entity';

export enum PaymentStatus {
  UNPAID = 'unpaid',
  PARTIAL = 'partial',
  PAID = 'paid',
}

export enum ProgressStage {
  ORDERED = 'ordered',
  PRODUCING = 'producing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
}

@Entity('bid_suppliers')
export class BidSupplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectItemId: string;

  @Column()
  supplierId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '单价' })
  price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, comment: '总金额 (单价 × 数量)' })
  amount: number;

  @Column({
    type: 'enum',
    enum: ProgressStage,
    default: ProgressStage.ORDERED,
  })
  progress: ProgressStage;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.UNPAID,
  })
  paymentStatus: PaymentStatus;

  @Column({ type: 'date', nullable: true })
  paymentTime: string | null;

  @Column({ type: 'text', nullable: true })
  remarks: string | null;

  @Column({ default: true })
  isSelected: boolean;

  @ManyToOne(() => BidProjectItem, item => item.suppliers, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectItemId' })
  @Exclude({ toPlainOnly: true })
  projectItem: BidProjectItem;

  @ManyToOne(() => Supplier, supplier => supplier.bidSuppliers)
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;
}
