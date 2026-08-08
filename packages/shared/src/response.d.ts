/**
 * 统一响应规范（Sprint 0 已冻结的 API 契约基础）
 * 所有后端接口返回均遵循：{ code, message, data, timestamp }
 */
export interface ApiResponse<T = unknown> {
    code: number;
    message: string;
    data: T;
    timestamp: string;
}
/** 业务成功 code = 0；其余为错误码 */
export declare const SUCCESS_CODE = 0;
export declare function ok<T>(data: T, message?: string): ApiResponse<T>;
export declare function fail(code: number, message: string, data?: unknown): ApiResponse<unknown>;
/** 错误码编目（初版，Sprint 0 冻结） */
export declare enum ErrorCode {
    BAD_REQUEST = 40000,
    UNAUTHORIZED = 40100,
    FORBIDDEN = 40300,
    NOT_FOUND = 40400,
    CONFLICT = 40900,
    VALIDATION = 42200,
    TOO_MANY_REQUESTS = 42900,
    INTERNAL = 50000
}
