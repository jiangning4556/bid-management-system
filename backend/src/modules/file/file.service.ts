import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as path from 'path';
import * as fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { FileRecord, FileType, TargetType } from './entities/file-record.entity';
import type { User } from '../user/entities/user.entity';

@Injectable()
export class FileService {
  private readonly uploadDir: string;
  private readonly maxFileSize: number;

  constructor(
    @InjectRepository(FileRecord)
    private readonly fileRecordRepository: Repository<FileRecord>,
    private readonly configService: ConfigService,
  ) {
    this.uploadDir = this.configService.get<string>('UPLOAD_DIR') || './uploads';
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE') || 10485760; // 10MB default
    this.ensureUploadDirExists();
  }

  private async ensureUploadDirExists() {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create upload directory:', error);
    }
  }

  async uploadFile(
    file: Express.Multer.File,
    type: FileType,
    targetType: TargetType,
    targetId: string,
    userId: string,
  ): Promise<FileRecord> {
    // Validate file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(this.uploadDir, uniqueFileName);

    // Save file to disk
    await fs.writeFile(filePath, file.buffer);

    // Create file record
    const fileRecord = this.fileRecordRepository.create({
      type,
      targetType,
      targetId,
      fileName: file.originalname,
      fileUrl: `/uploads/${uniqueFileName}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      userId,
    });

    return this.fileRecordRepository.save(fileRecord);
  }

  async findByTarget(targetType: TargetType, targetId: string): Promise<FileRecord[]> {
    return this.fileRecordRepository.find({
      where: { targetType, targetId },
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string, currentUser: User): Promise<FileRecord> {
    const fileRecord = await this.fileRecordRepository.findOne({
      where: { id },
    });

    if (!fileRecord) {
      throw new NotFoundException('File not found');
    }

    return fileRecord;
  }

  async deleteFile(id: string, currentUser: User): Promise<void> {
    const fileRecord = await this.findById(id, currentUser);

    // Delete physical file
    const filePath = path.join(process.cwd(), this.uploadDir, path.basename(fileRecord.fileUrl));
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn('Failed to delete physical file:', error);
    }

    // Delete database record
    await this.fileRecordRepository.delete(id);
  }

  async updateProofUrl(
    targetType: TargetType,
    targetId: string,
    fileUrl: string,
  ): Promise<void> {
    // This method will be used to update proofUrl in payment/receipt records
    // The actual update will be done in the payment service
  }
}
