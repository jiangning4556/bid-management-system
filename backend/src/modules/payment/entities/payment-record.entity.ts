import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BidProject } from '../../bid-project/entities/bid-project.entity';
import { Supplier } from '../../supplier/entities/supplier.entity';

@Entity('payment_records')
export class PaymentRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  projectId: string;

  @Index()
  @Column()
  supplierId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  amount: number;

  @Index()
  @Column({ type: 'date' })
  paymentTime: Date;

  @Column({ nullable: true })
  paymentMethod: string;

  @Column({ nullable: true })
  proofUrl: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Index()
  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => BidProject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: BidProject;

  @ManyToOne(() => Supplier, supplier => supplier.payments)
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;
}
