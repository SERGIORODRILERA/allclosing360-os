export type TenantStatus = "active" | "suspended" | "deleted";
export type TenantTier = "starter" | "growth" | "enterprise";

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
  tier: TenantTier;
  dbSchema: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  dbSchema: string;
  tier: TenantTier;
}
