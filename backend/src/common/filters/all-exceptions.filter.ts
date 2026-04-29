import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * 全局异常过滤器
 * 统一处理所有异常，返回标准格式的错误响应
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // 获取状态码和错误信息
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // 获取错误响应内容
    let errorResponse: any;
    if (exception instanceof HttpException) {
      errorResponse = exception.getResponse();
    } else {
      errorResponse = {
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: '服务器内部错误',
        },
      };
    }

    // 构建标准错误响应格式
    const standardError = this.buildStandardError(errorResponse, status);

    // 记录错误日志
    this.logError(exception, request, status);

    // 发送响应
    response.status(status).json(standardError);
  }

  /**
   * 构建标准错误响应格式
   */
  private buildStandardError(errorResponse: any, status: number) {
    // 如果已经是标准格式，直接返回
    if (errorResponse.success === false && errorResponse.error) {
      return errorResponse;
    }

    // 转换为标准格式
    const message = typeof errorResponse === 'string'
      ? errorResponse
      : errorResponse.message || '请求失败';

    return {
      success: false,
      error: {
        code: this.getErrorCode(status),
        message,
        details: errorResponse.details,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 根据 HTTP 状态码获取错误码
   */
  private getErrorCode(status: number): string {
    const errorCodes: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return errorCodes[status] || 'UNKNOWN_ERROR';
  }

  /**
   * 记录错误日志
   */
  private logError(exception: unknown, request: any, status: number) {
    const { method, url, ip } = request;

    if (status >= 500) {
      // 服务器错误，记录完整异常堆栈
      this.logger.error(
        `${method} ${url} - ${status} - ${ip}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (status >= 400) {
      // 客户端错误，记录简单日志
      const message = exception instanceof HttpException
        ? exception.message
        : 'Unknown error';
      this.logger.warn(`${method} ${url} - ${status} - ${message}`);
    }
  }
}
