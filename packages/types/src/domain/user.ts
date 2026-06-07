export type UserRole = "owner" | "admin" | "manager" | "agent" | "viewer";
export type UserStatus = "active" | "inactive" | "pending_invite";

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}
