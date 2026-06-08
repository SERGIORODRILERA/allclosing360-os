/**
 * connectors-real.ts
 * Real connector interfaces and stub implementations.
 * Each connector checks env vars via isConfigured() and exposes a testConnection() method.
 * No OAuth flow implemented yet — structure is production-ready.
 */

// ─── Shared types ─────────────────────────────────────────────────────────────

export interface ConnectorError {
  code: string;
  message: string;
  status?: number;
}

export type ConnectorResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: ConnectorError };

// ─── GoHighLevel ──────────────────────────────────────────────────────────────

export interface GHLContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tags?: string[];
  pipelineStageId?: string;
}

export interface GHLPipeline {
  id: string;
  name: string;
  stages: Array<{ id: string; name: string; position: number }>;
}

export interface GHLNote {
  contactId: string;
  body: string;
  userId?: string;
}

export interface GHLConnector {
  baseUrl: string;
  apiKey: string;
  locationId: string;
  isConfigured(): boolean;
  testConnection(): Promise<ConnectorResult<{ name: string; timezone: string }>>;
  getContacts(options?: { limit?: number; page?: number; query?: string }): Promise<ConnectorResult<GHLContact[]>>;
  createContact(contact: Omit<GHLContact, "id">): Promise<ConnectorResult<GHLContact>>;
  updateContact(id: string, data: Partial<GHLContact>): Promise<ConnectorResult<GHLContact>>;
  updatePipeline(contactId: string, pipelineId: string, stageId: string): Promise<ConnectorResult<void>>;
  addNote(note: GHLNote): Promise<ConnectorResult<{ id: string }>>;
}

export class GHLConnectorImpl implements GHLConnector {
  baseUrl = "https://services.leadconnectorhq.com";
  apiKey: string;
  locationId: string;

  constructor() {
    this.apiKey = process.env["GHL_API_KEY"] ?? process.env["NEXT_PUBLIC_GHL_API_KEY"] ?? "";
    this.locationId = process.env["GHL_LOCATION_ID"] ?? process.env["NEXT_PUBLIC_GHL_LOCATION_ID"] ?? "";
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.locationId);
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
      Version: "2021-07-28",
    };
  }

  async testConnection(): Promise<ConnectorResult<{ name: string; timezone: string }>> {
    if (!this.isConfigured()) {
      return { ok: false, error: { code: "NOT_CONFIGURED", message: "GHL_API_KEY o GHL_LOCATION_ID no configurados" } };
    }
    try {
      const res = await fetch(`${this.baseUrl}/locations/${this.locationId}`, { headers: this.headers });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { location: { name: string; timezone: string } };
      return { ok: true, data: { name: data.location.name, timezone: data.location.timezone } };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async getContacts(options: { limit?: number; page?: number; query?: string } = {}): Promise<ConnectorResult<GHLContact[]>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    try {
      const params = new URLSearchParams({
        locationId: this.locationId,
        limit: String(options.limit ?? 20),
        page: String(options.page ?? 1),
        ...(options.query ? { query: options.query } : {}),
      });
      const res = await fetch(`${this.baseUrl}/contacts/?${params}`, { headers: this.headers });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { contacts: GHLContact[] };
      return { ok: true, data: data.contacts };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async createContact(contact: Omit<GHLContact, "id">): Promise<ConnectorResult<GHLContact>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    try {
      const res = await fetch(`${this.baseUrl}/contacts/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ ...contact, locationId: this.locationId }),
      });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { contact: GHLContact };
      return { ok: true, data: data.contact };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async updateContact(id: string, data: Partial<GHLContact>): Promise<ConnectorResult<GHLContact>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    try {
      const res = await fetch(`${this.baseUrl}/contacts/${id}`, {
        method: "PUT",
        headers: this.headers,
        body: JSON.stringify(data),
      });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const result = await res.json() as { contact: GHLContact };
      return { ok: true, data: result.contact };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async updatePipeline(contactId: string, pipelineId: string, stageId: string): Promise<ConnectorResult<void>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    try {
      const res = await fetch(`${this.baseUrl}/opportunities/`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ contactId, pipelineId, pipelineStageId: stageId, locationId: this.locationId }),
      });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      return { ok: true, data: undefined };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async addNote(note: GHLNote): Promise<ConnectorResult<{ id: string }>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    try {
      const res = await fetch(`${this.baseUrl}/contacts/${note.contactId}/notes`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ body: note.body, userId: note.userId }),
      });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { note: { id: string } };
      return { ok: true, data: { id: data.note.id } };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }
}

// ─── WhatsApp Business API (Meta) ─────────────────────────────────────────────

export interface WhatsAppMessage {
  to: string;
  type: "text" | "template";
  text?: { body: string };
  template?: {
    name: string;
    language: { code: string };
    components?: Array<{
      type: "body" | "header" | "footer";
      parameters: Array<{ type: "text"; text: string }>;
    }>;
  };
}

export interface WhatsAppConversation {
  id: string;
  status: "open" | "closed";
  messages: Array<{
    id: string;
    from: string;
    timestamp: string;
    text?: { body: string };
    type: string;
  }>;
}

export interface WhatsAppConnector {
  phoneNumberId: string;
  accessToken: string;
  isConfigured(): boolean;
  testConnection(): Promise<ConnectorResult<{ displayPhoneNumber: string; verifiedName: string }>>;
  sendMessage(message: WhatsAppMessage): Promise<ConnectorResult<{ messageId: string }>>;
  sendTemplate(to: string, templateName: string, languageCode: string, params?: string[]): Promise<ConnectorResult<{ messageId: string }>>;
  getConversations(): Promise<ConnectorResult<WhatsAppConversation[]>>;
}

export class WhatsAppConnectorImpl implements WhatsAppConnector {
  phoneNumberId: string;
  accessToken: string;
  private baseUrl = "https://graph.facebook.com/v19.0";

  constructor() {
    this.phoneNumberId = process.env["WHATSAPP_PHONE_NUMBER_ID"] ?? "";
    this.accessToken = process.env["WHATSAPP_ACCESS_TOKEN"] ?? "";
  }

  isConfigured(): boolean {
    return Boolean(this.phoneNumberId && this.accessToken);
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      "Content-Type": "application/json",
    };
  }

  async testConnection(): Promise<ConnectorResult<{ displayPhoneNumber: string; verifiedName: string }>> {
    if (!this.isConfigured()) {
      return { ok: false, error: { code: "NOT_CONFIGURED", message: "WHATSAPP_PHONE_NUMBER_ID o WHATSAPP_ACCESS_TOKEN no configurados" } };
    }
    try {
      const res = await fetch(`${this.baseUrl}/${this.phoneNumberId}?fields=display_phone_number,verified_name`, { headers: this.headers });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { display_phone_number: string; verified_name: string };
      return { ok: true, data: { displayPhoneNumber: data.display_phone_number, verifiedName: data.verified_name } };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async sendMessage(message: WhatsAppMessage): Promise<ConnectorResult<{ messageId: string }>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    try {
      const res = await fetch(`${this.baseUrl}/${this.phoneNumberId}/messages`, {
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({ messaging_product: "whatsapp", recipient_type: "individual", ...message }),
      });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { messages: Array<{ id: string }> };
      return { ok: true, data: { messageId: data.messages?.[0]?.id ?? "" } };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async sendTemplate(to: string, templateName: string, languageCode = "es", params: string[] = []): Promise<ConnectorResult<{ messageId: string }>> {
    const message: WhatsAppMessage = {
      to,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        components: params.length > 0 ? [{
          type: "body",
          parameters: params.map((text) => ({ type: "text" as const, text })),
        }] : undefined,
      },
    };
    return this.sendMessage(message);
  }

  async getConversations(): Promise<ConnectorResult<WhatsAppConversation[]>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    // WhatsApp API does not expose conversation list directly; returns stub
    return { ok: true, data: [] };
  }
}

// ─── Meta Ads ─────────────────────────────────────────────────────────────────

export interface MetaCampaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  objective: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
}

export interface MetaAdSet {
  id: string;
  name: string;
  campaignId: string;
  status: string;
  targeting: Record<string, unknown>;
  bidAmount?: number;
}

export interface MetaInsights {
  impressions: number;
  reach: number;
  clicks: number;
  spend: number;
  cpc: number;
  cpm: number;
  ctr: number;
  conversions?: number;
}

export interface MetaAdsConnector {
  adAccountId: string;
  accessToken: string;
  isConfigured(): boolean;
  testConnection(): Promise<ConnectorResult<{ id: string; name: string; currency: string }>>;
  getCampaigns(): Promise<ConnectorResult<MetaCampaign[]>>;
  getAdSets(campaignId: string): Promise<ConnectorResult<MetaAdSet[]>>;
  getInsights(objectId: string, datePreset?: string): Promise<ConnectorResult<MetaInsights>>;
  createCampaign(name: string, objective: string, dailyBudget: number): Promise<ConnectorResult<MetaCampaign>>;
}

export class MetaAdsConnectorImpl implements MetaAdsConnector {
  adAccountId: string;
  accessToken: string;
  private baseUrl = "https://graph.facebook.com/v19.0";

  constructor() {
    this.adAccountId = process.env["META_AD_ACCOUNT_ID"] ?? "";
    this.accessToken = process.env["META_ACCESS_TOKEN"] ?? "";
  }

  isConfigured(): boolean {
    return Boolean(this.adAccountId && this.accessToken);
  }

  private get token() {
    return `access_token=${this.accessToken}`;
  }

  async testConnection(): Promise<ConnectorResult<{ id: string; name: string; currency: string }>> {
    if (!this.isConfigured()) {
      return { ok: false, error: { code: "NOT_CONFIGURED", message: "META_AD_ACCOUNT_ID o META_ACCESS_TOKEN no configurados" } };
    }
    try {
      const res = await fetch(`${this.baseUrl}/act_${this.adAccountId}?fields=id,name,currency&${this.token}`);
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { id: string; name: string; currency: string };
      return { ok: true, data };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async getCampaigns(): Promise<ConnectorResult<MetaCampaign[]>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    try {
      const res = await fetch(`${this.baseUrl}/act_${this.adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget&${this.token}`);
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { data: Array<{ id: string; name: string; status: string; objective: string; daily_budget?: string; lifetime_budget?: string }> };
      return {
        ok: true,
        data: data.data.map((c) => ({
          id: c.id,
          name: c.name,
          status: c.status as MetaCampaign["status"],
          objective: c.objective,
          dailyBudget: c.daily_budget ? parseInt(c.daily_budget) / 100 : undefined,
          lifetimeBudget: c.lifetime_budget ? parseInt(c.lifetime_budget) / 100 : undefined,
        })),
      };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async getAdSets(campaignId: string): Promise<ConnectorResult<MetaAdSet[]>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    try {
      const res = await fetch(`${this.baseUrl}/${campaignId}/adsets?fields=id,name,campaign_id,status,targeting,bid_amount&${this.token}`);
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { data: Array<{ id: string; name: string; campaign_id: string; status: string; targeting: Record<string, unknown>; bid_amount?: number }> };
      return {
        ok: true,
        data: data.data.map((a) => ({
          id: a.id,
          name: a.name,
          campaignId: a.campaign_id,
          status: a.status,
          targeting: a.targeting,
          bidAmount: a.bid_amount,
        })),
      };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async getInsights(objectId: string, datePreset = "last_7d"): Promise<ConnectorResult<MetaInsights>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    try {
      const res = await fetch(`${this.baseUrl}/${objectId}/insights?fields=impressions,reach,clicks,spend,cpc,cpm,ctr&date_preset=${datePreset}&${this.token}`);
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { data: Array<{ impressions: string; reach: string; clicks: string; spend: string; cpc: string; cpm: string; ctr: string }> };
      const d = data.data[0];
      if (!d) return { ok: false, error: { code: "NO_DATA", message: "Sin datos para este periodo" } };
      return {
        ok: true,
        data: {
          impressions: parseInt(d.impressions),
          reach: parseInt(d.reach),
          clicks: parseInt(d.clicks),
          spend: parseFloat(d.spend),
          cpc: parseFloat(d.cpc),
          cpm: parseFloat(d.cpm),
          ctr: parseFloat(d.ctr),
        },
      };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async createCampaign(name: string, objective: string, dailyBudget: number): Promise<ConnectorResult<MetaCampaign>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    try {
      const body = new URLSearchParams({
        name,
        objective,
        status: "PAUSED",
        daily_budget: String(dailyBudget * 100),
        access_token: this.accessToken,
      });
      const res = await fetch(`${this.baseUrl}/act_${this.adAccountId}/campaigns`, { method: "POST", body });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { id: string };
      return { ok: true, data: { id: data.id, name, status: "PAUSED", objective, dailyBudget } };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }
}

// ─── Google Calendar ──────────────────────────────────────────────────────────

export interface CalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  startDateTime: string; // ISO 8601
  endDateTime: string;   // ISO 8601
  attendees?: Array<{ email: string; displayName?: string }>;
  location?: string;
  timeZone?: string;
}

export interface GoogleCalendarConnector {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  isConfigured(): boolean;
  testConnection(): Promise<ConnectorResult<{ email: string; calendarId: string }>>;
  getEvents(calendarId?: string, timeMin?: string, timeMax?: string, maxResults?: number): Promise<ConnectorResult<CalendarEvent[]>>;
  createEvent(calendarId: string, event: Omit<CalendarEvent, "id">): Promise<ConnectorResult<CalendarEvent>>;
  updateEvent(calendarId: string, eventId: string, data: Partial<CalendarEvent>): Promise<ConnectorResult<CalendarEvent>>;
  deleteEvent(calendarId: string, eventId: string): Promise<ConnectorResult<void>>;
}

export class GoogleCalendarConnectorImpl implements GoogleCalendarConnector {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  private baseUrl = "https://www.googleapis.com/calendar/v3";
  private _accessToken: string | null = null;
  private _tokenExpiry: number = 0;

  constructor() {
    this.clientId = process.env["GOOGLE_CLIENT_ID"] ?? "";
    this.clientSecret = process.env["GOOGLE_CLIENT_SECRET"] ?? "";
    this.refreshToken = process.env["GOOGLE_REFRESH_TOKEN"] ?? "";
  }

  isConfigured(): boolean {
    return Boolean(this.clientId && this.clientSecret && this.refreshToken);
  }

  private async getAccessToken(): Promise<string | null> {
    if (this._accessToken && Date.now() < this._tokenExpiry - 60_000) {
      return this._accessToken;
    }
    try {
      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          refresh_token: this.refreshToken,
          grant_type: "refresh_token",
        }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { access_token: string; expires_in: number };
      this._accessToken = data.access_token;
      this._tokenExpiry = Date.now() + data.expires_in * 1000;
      return this._accessToken;
    } catch {
      return null;
    }
  }

  async testConnection(): Promise<ConnectorResult<{ email: string; calendarId: string }>> {
    if (!this.isConfigured()) {
      return { ok: false, error: { code: "NOT_CONFIGURED", message: "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET o GOOGLE_REFRESH_TOKEN no configurados" } };
    }
    const token = await this.getAccessToken();
    if (!token) return { ok: false, error: { code: "AUTH_ERROR", message: "No se pudo obtener access token" } };
    try {
      const res = await fetch(`${this.baseUrl}/users/me/calendarList/primary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { id: string; summary: string };
      return { ok: true, data: { email: data.summary, calendarId: data.id } };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async getEvents(calendarId = "primary", timeMin?: string, timeMax?: string, maxResults = 10): Promise<ConnectorResult<CalendarEvent[]>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    const token = await this.getAccessToken();
    if (!token) return { ok: false, error: { code: "AUTH_ERROR", message: "Token no disponible" } };
    try {
      const params = new URLSearchParams({
        maxResults: String(maxResults),
        orderBy: "startTime",
        singleEvents: "true",
        ...(timeMin ? { timeMin } : {}),
        ...(timeMax ? { timeMax } : {}),
      });
      const res = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { items: Array<{ id: string; summary: string; description?: string; start: { dateTime: string }; end: { dateTime: string }; location?: string; attendees?: Array<{ email: string; displayName?: string }> }> };
      return {
        ok: true,
        data: data.items.map((e) => ({
          id: e.id,
          summary: e.summary,
          description: e.description,
          startDateTime: e.start.dateTime,
          endDateTime: e.end.dateTime,
          location: e.location,
          attendees: e.attendees,
        })),
      };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async createEvent(calendarId: string, event: Omit<CalendarEvent, "id">): Promise<ConnectorResult<CalendarEvent>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    const token = await this.getAccessToken();
    if (!token) return { ok: false, error: { code: "AUTH_ERROR", message: "Token no disponible" } };
    try {
      const body = {
        summary: event.summary,
        description: event.description,
        location: event.location,
        start: { dateTime: event.startDateTime, timeZone: event.timeZone ?? "Europe/Madrid" },
        end: { dateTime: event.endDateTime, timeZone: event.timeZone ?? "Europe/Madrid" },
        attendees: event.attendees,
      };
      const res = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const data = await res.json() as { id: string; summary: string; start: { dateTime: string }; end: { dateTime: string } };
      return { ok: true, data: { ...event, id: data.id } };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async updateEvent(calendarId: string, eventId: string, data: Partial<CalendarEvent>): Promise<ConnectorResult<CalendarEvent>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    const token = await this.getAccessToken();
    if (!token) return { ok: false, error: { code: "AUTH_ERROR", message: "Token no disponible" } };
    try {
      const body: Record<string, unknown> = {};
      if (data.summary) body["summary"] = data.summary;
      if (data.description !== undefined) body["description"] = data.description;
      if (data.startDateTime) body["start"] = { dateTime: data.startDateTime, timeZone: data.timeZone ?? "Europe/Madrid" };
      if (data.endDateTime) body["end"] = { dateTime: data.endDateTime, timeZone: data.timeZone ?? "Europe/Madrid" };
      if (data.location !== undefined) body["location"] = data.location;
      if (data.attendees) body["attendees"] = data.attendees;
      const res = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      const result = await res.json() as { id: string; summary: string; start: { dateTime: string }; end: { dateTime: string } };
      return {
        ok: true,
        data: {
          id: result.id,
          summary: result.summary,
          startDateTime: result.start.dateTime,
          endDateTime: result.end.dateTime,
          ...data,
        },
      };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }

  async deleteEvent(calendarId: string, eventId: string): Promise<ConnectorResult<void>> {
    if (!this.isConfigured()) return { ok: false, error: { code: "NOT_CONFIGURED", message: "No configurado" } };
    const token = await this.getAccessToken();
    if (!token) return { ok: false, error: { code: "AUTH_ERROR", message: "Token no disponible" } };
    try {
      const res = await fetch(`${this.baseUrl}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return { ok: false, error: { code: "API_ERROR", message: `HTTP ${res.status}`, status: res.status } };
      return { ok: true, data: undefined };
    } catch (e) {
      return { ok: false, error: { code: "NETWORK_ERROR", message: String(e) } };
    }
  }
}

// ─── Connector registry singleton ────────────────────────────────────────────
// Only safe to use server-side (API routes) — not in client components

export type ConnectorId = "ghl" | "whatsapp" | "meta_ads" | "google_calendar";

export interface ConnectorRegistry {
  ghl: GHLConnectorImpl;
  whatsapp: WhatsAppConnectorImpl;
  meta_ads: MetaAdsConnectorImpl;
  google_calendar: GoogleCalendarConnectorImpl;
}

let _registry: ConnectorRegistry | null = null;

export function getConnectors(): ConnectorRegistry {
  if (!_registry) {
    _registry = {
      ghl: new GHLConnectorImpl(),
      whatsapp: new WhatsAppConnectorImpl(),
      meta_ads: new MetaAdsConnectorImpl(),
      google_calendar: new GoogleCalendarConnectorImpl(),
    };
  }
  return _registry;
}

export function getConnectorStatus(id: ConnectorId): "configured" | "unconfigured" {
  const registry = getConnectors();
  return registry[id].isConfigured() ? "configured" : "unconfigured";
}
