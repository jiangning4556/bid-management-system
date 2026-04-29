import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { User } from '../../user/entities/user.entity';

export type ReportDataSource = 'projects' | 'suppliers' | 'payments' | 'receipts' | 'items';
export type ReportFormat = 'excel' | 'pdf';

@Entity('report_templates')
export class ReportTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: ['projects', 'suppliers', 'payments', 'receipts', 'items'],
  })
  dataSource: ReportDataSource;

  @Column('json')
  fields: string[];

  @Column('json', { nullable: true })
  filters: Record<string, any>;

  @Column({
    type: 'enum',
    enum: ['excel', 'pdf'],
    default: 'excel',
  })
  defaultFormat: ReportFormat;

  @Index()
  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
