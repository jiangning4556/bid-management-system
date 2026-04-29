import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ConsultProjectItem } from './consult-project-item.entity';
import { Supplier } from '../../supplier/entities/supplier.entity';

@Entity('supplier_quotes')
export class SupplierQuote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectItemId: string;

  @Column()
  supplierId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Column({ default: false })
  isSelected: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ConsultProjectItem, item => item.quotes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectItemId' })
  @Exclude({ toPlainOnly: true })
  projectItem: ConsultProjectItem;

  @ManyToOne(() => Supplier, supplier => supplier.quotes)
  @JoinColumn({ name: 'supplierId' })
  supplier: Supplier;
}
