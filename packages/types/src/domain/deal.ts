export type DealStatus = "open" | "won" | "lost" | "archived";

export interface Deal {
  id: string;
  tenantId: string;
  contactId: string;
  ownerId: string;
  title: string;
  status: DealStatus;
  stageId: string;
  value: number;
  currency: string;
  probability: number;
  expectedCloseDate: Date | null;
  actualCloseDate: Date | null;
  healthScore: number;
  createdAt: Date;
  updatedAt: Date;
}
