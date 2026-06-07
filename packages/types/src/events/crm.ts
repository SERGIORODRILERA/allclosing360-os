import type { Contact, Deal } from "../domain";

export interface ContactCreatedEvent {
  type: "crm.contact.created";
  tenantId: string;
  payload: Contact;
  timestamp: string;
}

export interface ContactUpdatedEvent {
  type: "crm.contact.updated";
  tenantId: string;
  payload: { contactId: string; changes: Partial<Contact> };
  timestamp: string;
}

export interface DealCreatedEvent {
  type: "crm.deal.created";
  tenantId: string;
  payload: Deal;
  timestamp: string;
}

export interface DealStageChangedEvent {
  type: "crm.deal.stage_changed";
  tenantId: string;
  payload: { dealId: string; fromStageId: string; toStageId: string };
  timestamp: string;
}

export interface DealWonEvent {
  type: "crm.deal.won";
  tenantId: string;
  payload: { dealId: string; value: number; currency: string };
  timestamp: string;
}

export type CrmEvent =
  | ContactCreatedEvent
  | ContactUpdatedEvent
  | DealCreatedEvent
  | DealStageChangedEvent
  | DealWonEvent;
