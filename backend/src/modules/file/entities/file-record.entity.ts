import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

export enum FileType {
  TENDER = 'tender',
  BID = 'bid',
  AWARD_NOTICE = 'award_notice',
  CONTRACT = 'contract',
  QUOTE = 'quote',
  QUALIFICATION = 'qualification',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  OTHER = 'other',
}

export enum TargetType {
  PROJECT = 'project',
  SUPPLIER = 'supplier',
  PAYMENT = 'payment',
  RECEIPT = 'receipt',
}

@Entity('file_records')
export class FileRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: FileType,
  })
  type: FileType;

  @Column({
    type: 'enum',
    enum: TargetType,
  })
  targetType: TargetType;

  @Column()
  targetId: string;

  @Column()
  fileName: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column({ nullable: true })
  mimeType: string;

  @Column()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}
