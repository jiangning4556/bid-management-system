import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { Exclude } from 'class-transformer';
import { User } from '../../user/entities/user.entity';
import { ConsultProjectItem } from './consult-project-item.entity';

export enum ConsultProjectStatus {
  CONSULTING = 'consulting',
  QUOTED = 'quoted',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
}

@Entity('consult_projects')
@Index(['userId', 'deletedAt']) // Composite index for user + soft delete queries
export class ConsultProject {
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
  consultDate: string;

  @Column({ type: 'text', nullable: true })
  remarks: string;

  @Index()
  @Column({
    type: 'enum',
    enum: ConsultProjectStatus,
    default: ConsultProjectStatus.CONSULTING,
  })
  status: ConsultProjectStatus;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  totalAmount: number;

  @Index()
  @Column({ default: false })
  hasBidProject: boolean;

  @Index()
  @Column({ nullable: true })
  bidProjectId: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Relations
  @ManyToOne(() => User, user => user.consultProjects)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => ConsultProjectItem, item => item.project)
  projectItems: ConsultProjectItem[];
}
