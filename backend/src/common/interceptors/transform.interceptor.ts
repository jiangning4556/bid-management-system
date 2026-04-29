import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';

/**
 * 统一响应格式拦截器
 * 将所有成功响应包装为标准格式
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, any>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<any> {
    return next.handle().pipe(
      map((data) => this.transformResponse(data)),
    );
  }

  /**
   * 转换响应为标准格式
   */
  private transformResponse(data: any) {
    // 如果已经是标准格式，直接返回
    if (data && typeof data === 'object' && 'success' in data) {
      return data;
    }

    // 列表数据格式（PaginatedResponse）
    if (data && typeof data === 'object' && 'data' in data && 'total' in data) {
      // 将分页信息包含在 data 对象内，方便前端解包后使用
      const paginatedData = {
        data: this.serializeData(data.data),
        total: data.total,
        page: data.page || 1,
        limit: data.limit || 10,
        totalPages: data.totalPages || Math.ceil(data.total / (data.limit || 10)),
      };
      return {
        success: true,
        data: paginatedData,
        timestamp: new Date().toISOString(),
      };
    }

    // 单个资源或简单数据
    return {
      success: true,
      data: this.serializeData(data),
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * 使用 class-transformer 序列化数据，处理 @Exclude 装饰器
   */
  private serializeData(data: any): any {
    if (!data) return data;
    if (typeof data !== 'object') return data;
    if (Array.isArray(data)) {
      return data.map(item => this.serializeData(item));
    }
    // 使用 instanceToPlain 来应用 @Exclude 装饰器
    // enableCircularCheck: true 防止循环引用导致错误
    // exposeUnsetFields: false 确保只暴露已设置的属性
    return instanceToPlain(data, {
      enableCircularCheck: true,
      exposeUnsetFields: false,
    });
  }
}

/**
 * 不转换的响应拦截器
 * 用于文件下载等特殊场景
 */
@Injectable()
export class NoTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle();
  }
}
