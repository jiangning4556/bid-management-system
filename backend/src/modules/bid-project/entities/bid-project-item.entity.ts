import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BidProject } from './bid-project.entity';
import { BidSupplier } from './bid-supplier.entity';
import { Item } from '../../item/entities/item.entity';

@Entity('bid_project_items')
export class BidProjectItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  projectId: string;

  @Column()
  itemId: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @ManyToOne(() => BidProject, project => project.projectItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  @Exclude({ toPlainOnly: true })
  project: BidProject;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @OneToMany(() => BidSupplier, bidSupplier => bidSupplier.projectItem)
  suppliers: BidSupplier[];
}
