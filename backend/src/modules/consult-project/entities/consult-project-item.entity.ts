import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { Exclude } from 'class-transformer';
import { ConsultProject } from './consult-project.entity';
import { SupplierQuote } from './supplier-quote.entity';
import { Item } from '../../item/entities/item.entity';

@Entity('consult_project_items')
export class ConsultProjectItem {
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

  @ManyToOne(() => ConsultProject, project => project.projectItems, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  @Exclude({ toPlainOnly: true })
  project: ConsultProject;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'itemId' })
  item: Item;

  @OneToMany(() => SupplierQuote, quote => quote.projectItem)
  quotes: SupplierQuote[];
}
