import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany } from 'typeorm';
import { Supplier } from '../../supplier/entities/supplier.entity';
import { Category } from '../../category/entities/category.entity';
import { Item } from '../../item/entities/item.entity';
import { ConsultProject } from '../../consult-project/entities/consult-project.entity';
import { BidProject } from '../../bid-project/entities/bid-project.entity';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface UserInfo {
  id: string;
  username: string;
  role: UserRole;
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column()
  password: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ unique: true, nullable: true })
  phone: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relations
  @OneToMany(() => Supplier, supplier => supplier.user)
  suppliers: Supplier[];

  @OneToMany(() => Category, category => category.user)
  categories: Category[];

  @OneToMany(() => Item, item => item.user)
  items: Item[];

  @OneToMany(() => ConsultProject, project => project.user)
  consultProjects: ConsultProject[];

  @OneToMany(() => BidProject, project => project.user)
  bidProjects: BidProject[];
}
