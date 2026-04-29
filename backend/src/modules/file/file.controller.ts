import { Controller, Post, Get, Delete, UseGuards, ParseUUIDPipe, Body, UploadedFile, UseInterceptors, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileService } from './file.service';
import { FileType, TargetType } from './entities/file-record.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import type { UserInfo } from '../user/entities/user.entity';

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('type') type: FileType,
    @Body('targetType') targetType: TargetType,
    @Body('targetId') targetId: string,
    @User() user: UserInfo,
  ) {
    return this.fileService.uploadFile(file, type, targetType, targetId, user.id);
  }

  @Get(':targetType/:targetId')
  findByTarget(
    @Param('targetType') targetType: TargetType,
    @Param('targetId') targetId: string,
  ) {
    return this.fileService.findByTarget(targetType, targetId);
  }

  @Delete(':id')
  deleteFile(@Param('id', ParseUUIDPipe) id: string, @User() user: UserInfo) {
    return this.fileService.deleteFile(id, user as any);
  }
}
