import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, ManyToMany, JoinColumn, JoinTable } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Category } from '../../category/entities/category.entity';
import { Supplier } from '../../supplier/entities/supplier.entity';

@Entity('items')
export class Item {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  spec: string;

  @Column({ nullable: true })
  unit: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  attributes: Record<string, any>;

  @Column()
  categoryId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.items)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Category, category => category.items)
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ManyToMany(() => Supplier, supplier => supplier.items)
  @JoinTable({
    name: 'item_suppliers',
    joinColumn: { name: 'itemId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'supplierId', referencedColumnName: 'id' },
  })
  suppliers: Supplier[];
}
