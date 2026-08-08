/**
 * 统一响应规范（Sprint 0 已冻结的 API 契约基础）
 * 所有后端接口返回均遵循：{ code, message, data, timestamp }
 */
/** 业务成功 code = 0；其余为错误码 */
export const SUCCESS_CODE = 0;
export function ok(data, message = 'success') {
    return {
        code: SUCCESS_CODE,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}
export function fail(code, message, data = null) {
    return {
        code,
        message,
        data,
        timestamp: new Date().toISOString(),
    };
}
/** 错误码编目（初版，Sprint 0 冻结） */
export var ErrorCode;
(function (ErrorCode) {
    ErrorCode[ErrorCode["BAD_REQUEST"] = 40000] = "BAD_REQUEST";
    ErrorCode[ErrorCode["UNAUTHORIZED"] = 40100] = "UNAUTHORIZED";
    ErrorCode[ErrorCode["FORBIDDEN"] = 40300] = "FORBIDDEN";
    ErrorCode[ErrorCode["NOT_FOUND"] = 40400] = "NOT_FOUND";
    ErrorCode[ErrorCode["CONFLICT"] = 40900] = "CONFLICT";
    ErrorCode[ErrorCode["VALIDATION"] = 42200] = "VALIDATION";
    ErrorCode[ErrorCode["TOO_MANY_REQUESTS"] = 42900] = "TOO_MANY_REQUESTS";
    ErrorCode[ErrorCode["INTERNAL"] = 50000] = "INTERNAL";
})(ErrorCode || (ErrorCode = {}));
