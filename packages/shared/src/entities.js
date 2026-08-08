/**
 * 共享领域类型（与后端 TypeORM 实体一一对应，供前端 IDE 提示）
 */
/** 角色枚举（前后端共用，用于 RBAC 鉴权） */
export var Role;
(function (Role) {
    Role["ADMIN"] = "admin";
    Role["AUTHOR"] = "author";
    Role["READER"] = "reader";
})(Role || (Role = {}));
