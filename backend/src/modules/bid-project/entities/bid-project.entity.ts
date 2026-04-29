import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../user/entities/user.entity';
import { ConsultProject } from '../../consult-project/entities/consult-project.entity';
import { BidProjectItem } from './bid-project-item.entity';
import { ReceiptRecord } from '../../payment/entities/receipt-record.entity';

export enum BidProjectStatus {
  PREPARING = 'preparing',
  IN_PROGRESS = 'in_progress',
  ACCEPTED = 'accepted',
  COMPLETED = 'completed',
}

@Entity('bid_projects')
@Index(['userId', 'deletedAt']) // Composite index for user + soft delete queries
export class BidProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Index()
  @Column({ nullable: true })
  projectCode: string;

  @Column({ nullable: true })
  customer: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Index()
  @Column({ type: 'date', nullable: true })
  contractDate: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  contractAmount: number;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Index()
  @Column({
    type: 'enum',
    enum: BidProjectStatus,
    default: BidProjectStatus.PREPARING,
  })
  status: BidProjectStatus;

  @Index()
  @Column({ nullable: true })
  consultProjectId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.bidProjects)
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => ConsultProject, { nullable: true })
  @JoinColumn({ name: 'consultProjectId' })
  consultProject: ConsultProject;

  @OneToMany(() => BidProjectItem, item => item.project)
  projectItems: BidProjectItem[];

  @OneToMany(() => ReceiptRecord, receipt => receipt.project)
  @Exclude({ toPlainOnly: true })
  receipts: ReceiptRecord[];
}
