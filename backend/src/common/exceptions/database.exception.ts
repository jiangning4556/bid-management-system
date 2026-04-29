import { QueryFailedError } from 'typeorm';
import { ConflictException, InternalServerErrorException } from '@nestjs/common';

/**
 * 数据库异常处理工具类
 */
export class DatabaseExceptionHandler {
  /**
   * 处理 TypeORM 查询失败异常
   */
  static handleQueryFailed(error: QueryFailedError): never {
    const errorMessage = error.message;

    // 外键约束冲突
    if (errorMessage.includes('foreign key constraint fails')) {
      throw new ConflictException({
        success: false,
        error: {
          code: 'FOREIGN_KEY_VIOLATION',
          message: '操作失败：存在关联数据',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 唯一约束冲突
    if (errorMessage.includes('Duplicate entry')) {
      const match = errorMessage.match(/Duplicate entry '(.+?)' for key '(.+?)'/);
      const field = match ? match[2] : '字段';
      throw new ConflictException({
        success: false,
        error: {
          code: 'DUPLICATE_ENTRY',
          message: `${field}的值已存在`,
          details: {
            field,
            value: match ? match[1] : undefined,
          },
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 连接失败
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('connect')) {
      throw new InternalServerErrorException({
        success: false,
        error: {
          code: 'DATABASE_CONNECTION_FAILED',
          message: '数据库连接失败，请稍后重试',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // 其他数据库错误
    throw new InternalServerErrorException({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: '数据库操作失败，请稍后重试',
      },
      timestamp: new Date().toISOString(),
    });
  }
}
