import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 业务异常基类
 * 用于处理业务逻辑中的错误
 */
export class BusinessException extends HttpException {
  constructor(response: string | Record<string, any>, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    const errorResponse = typeof response === 'string'
      ? {
          success: false,
          error: {
            code: 'BUSINESS_ERROR',
            message: response,
          },
          timestamp: new Date().toISOString(),
        }
      : {
          ...response,
          success: false,
          timestamp: new Date().toISOString(),
        };

    super(errorResponse, status);
  }
}

/**
 * 资源未找到异常
 */
export class ResourceNotFoundException extends BusinessException {
  constructor(resource: string = '资源') {
    super({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `${resource}不存在`,
      },
      timestamp: new Date().toISOString(),
    }, HttpStatus.NOT_FOUND);
  }
}

/**
 * 资源冲突异常
 */
export class ResourceConflictException extends BusinessException {
  constructor(message: string) {
    super({
      success: false,
      error: {
        code: 'CONFLICT',
        message,
      },
      timestamp: new Date().toISOString(),
    }, HttpStatus.CONFLICT);
  }
}

/**
 * 验证失败异常
 */
export class ValidationException extends BusinessException {
  constructor(details: Record<string, string[]> | string) {
    const message = typeof details === 'string' ? details : '请求参数验证失败';
    const response: any = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
      },
      timestamp: new Date().toISOString(),
    };

    if (typeof details === 'object') {
      response.error.details = details;
    }

    super(response, HttpStatus.BAD_REQUEST);
  }
}
