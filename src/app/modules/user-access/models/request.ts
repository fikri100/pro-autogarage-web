// Request payloads for User Access Module
export interface CreateUserRequest {
  username: string;
  name: string;
  roleId: number;
  password?: string;
}

export interface UpdateRolePermissionsRequest {
  permissions: string;
}
