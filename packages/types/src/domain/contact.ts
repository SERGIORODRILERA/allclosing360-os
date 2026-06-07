export type ContactType = "lead" | "prospect" | "client" | "partner" | "other";
export type ContactStatus = "active" | "inactive" | "archived";

export interface Contact {
  id: string;
  tenantId: string;
  type: ContactType;
  status: ContactStatus;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  ownerId: string | null;
  score: number;
  enrichedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}
