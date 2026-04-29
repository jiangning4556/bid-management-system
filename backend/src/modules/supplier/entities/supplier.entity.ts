import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, ManyToMany, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../user/entities/user.entity';
import { SupplierQuote } from '../../consult-project/entities/supplier-quote.entity';
import { BidSupplier } from '../../bid-project/entities/bid-supplier.entity';
import { PaymentRecord } from '../../payment/entities/payment-record.entity';
import { Item } from '../../item/entities/item.entity';

export enum SupplierStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
}

@Entity('suppliers')
export class Supplier {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  displayId: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  // Financial info
  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  bankAccount: string;

  @Column({ nullable: true })
  taxNumber: string;

  @Column({ nullable: true })
  invoiceInfo: string;

  // Statistics
  @Column({ default: 0 })
  projectCount: number;

  @Column({ default: 0 })
  bidProjectCount: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  bidRate: number;

  // Ratings
  @Column({ type: 'int', default: 5 })
  rating: number;

  @Column({ type: 'int', default: 5 })
  deliveryRating: number;

  @Column({ nullable: true })
  remarks: string;

  @Column({
    type: 'enum',
    enum: SupplierStatus,
    default: SupplierStatus.ACTIVE,
  })
  status: SupplierStatus;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.suppliers)
  @JoinColumn({ name: 'userId' })
  @Exclude({ toPlainOnly: true })
  user: User;

  @OneToMany(() => SupplierQuote, quote => quote.supplier)
  @Exclude({ toPlainOnly: true })
  quotes: SupplierQuote[];

  @OneToMany(() => BidSupplier, bidSupplier => bidSupplier.supplier)
  @Exclude({ toPlainOnly: true })
  bidSuppliers: BidSupplier[];

  @OneToMany(() => PaymentRecord, payment => payment.supplier)
  @Exclude({ toPlainOnly: true })
  payments: PaymentRecord[];

  @ManyToMany(() => Item, item => item.suppliers)
  @Exclude({ toPlainOnly: true })
  items: Item[];
}
