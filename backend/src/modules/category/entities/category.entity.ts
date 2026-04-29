import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Item } from '../../item/entities/item.entity';

@Entity('categories')
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  code: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  parentId: string;

  @Column({ default: 1 })
  level: number;

  @Column({ type: 'json', nullable: true })
  attributes: Record<string, any>;

  @Column({ default: 0 })
  sort: number;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.categories)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Category, category => category.children, { nullable: true })
  @JoinColumn({ name: 'parentId' })
  parent: Category;

  @OneToMany(() => Category, category => category.parent)
  children: Category[];

  @OneToMany(() => Item, item => item.category)
  items: Item[];
}
