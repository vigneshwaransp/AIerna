// ─────────────────────────────────────────────────────────────────────────────
// AIrena Smart Tournament Operations Platform
// API Client — lib/api.ts
// ─────────────────────────────────────────────────────────────────────────────

export const BASE_URL = 'http://localhost:8000';
export const WS_URL   = 'ws://localhost:8000/ws/telemetry';

// ─── Domain Interfaces ───────────────────────────────────────────────────────

export interface Zone {
  id: number;
  name: string;
  safe_capacity: number;
  current_capacity: number;
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  coordinate_x: number;
  coordinate_y: number;
}

export interface Incident {
  id: number;
  category: string;
  description: string;
  location_zone: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  timestamp: string;
  reporter_name: string;
  assigned_responder?: string;
  ai_summary?: string;
  recommended_actions?: string[];
  nearest_resources?: string[];
  safe_routes?: string[];
}

export interface LostPerson {
  id: number;
  name: string;
  age: number;
  description: string;
  clothing: string;
  last_seen_location: string;
  last_seen_time: string;
  status: 'searching' | 'found' | 'reunited';
  reported_at: string;
  timeline_json?: Record<string, unknown>[];
  search_recommendations?: string[];
}

export interface Announcement {
  id: number;
  message: string;
  category: string;
  target_role: string;
  original_lang: string;
  translations_json?: Record<string, string>;
  timestamp: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  recipient_role: string;
  is_read: boolean;
  timestamp: string;
}

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'security' | 'medic' | 'staff' | 'viewer';
  preferred_language: string;
  last_active: string;
}

export interface AIChatResponse {
  response: string;
  suggested_actions: string[];
  language: string;
}

export interface AIReport {
  incident_id: number;
  title: string;
  summary: string;
  key_findings: string[];
  timeline: { timestamp: string; event: string }[];
  corrective_actions: string[];
  status: string;
  generated_at: string;
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

/**
 * Generic fetch wrapper that throws a descriptive error on non-2xx responses.
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  if (!response.ok) {
    let detail = `HTTP ${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      if (body?.detail) detail = body.detail;
    } catch {
      // ignore parse errors — use the status text
    }
    throw new Error(`[AIrena API] ${path}: ${detail}`);
  }

  // Handle 204 No Content
  if (response.status === 204) return undefined as unknown as T;

  return response.json() as Promise<T>;
}

// ─── Zone Endpoints ──────────────────────────────────────────────────────────

/** Fetch all venue zones with live capacity data. */
export async function getZones(): Promise<Zone[]> {
  return apiFetch<Zone[]>('/zones/');
}

/**
 * Ask the AI engine to simulate crowd density for a specific zone.
 * Returns raw analysis object from the backend.
 */
export async function simulateZoneCrowd(
  zoneId: number,
  currentCapacity: number,
): Promise<unknown> {
  return apiFetch<unknown>('/zones/simulate/', {
    method: 'POST',
    body: JSON.stringify({ zone_id: zoneId, current_capacity: currentCapacity }),
  });
}

// ─── Incident Endpoints ──────────────────────────────────────────────────────

/** Fetch all incidents, newest first. */
export async function getIncidents(): Promise<Incident[]> {
  return apiFetch<Incident[]>('/incidents/');
}

/** Report a new incident. */
export async function createIncident(
  data: Omit<Incident, 'id' | 'timestamp' | 'ai_summary' | 'recommended_actions' | 'nearest_resources' | 'safe_routes'>,
): Promise<Incident> {
  return apiFetch<Incident>('/incidents/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/** Update an existing incident (e.g. change status, assign responder). */
export async function updateIncident(
  id: number,
  data: Partial<Incident>,
): Promise<Incident> {
  return apiFetch<Incident>(`/incidents/${id}/`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

/** Request an AI-generated post-incident report. */
export async function getIncidentReport(id: number): Promise<AIReport> {
  return apiFetch<AIReport>(`/incidents/${id}/report/`);
}

// ─── AI Chat Endpoint ────────────────────────────────────────────────────────

export interface AIChatQuery {
  message: string;
  role: string;
  zone?: string;
  preferred_language: string;
}

/** Send a natural-language query to the AIrena AI assistant. */
export async function chatWithAI(query: AIChatQuery): Promise<AIChatResponse> {
  return apiFetch<AIChatResponse>('/ai/chat/', {
    method: 'POST',
    body: JSON.stringify(query),
  });
}

// ─── Announcement Endpoints ──────────────────────────────────────────────────

/** Fetch all active announcements. */
export async function getAnnouncements(): Promise<Announcement[]> {
  return apiFetch<Announcement[]>('/announcements/');
}

/** Publish a new announcement (auto-translated by backend). */
export async function createAnnouncement(
  data: Omit<Announcement, 'id' | 'timestamp' | 'translations_json'>,
): Promise<Announcement> {
  return apiFetch<Announcement>('/announcements/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Lost Person Endpoints ───────────────────────────────────────────────────

/** Fetch all lost-person reports. */
export async function getLostPersons(): Promise<LostPerson[]> {
  return apiFetch<LostPerson[]>('/lost-persons/');
}

/** Submit a new lost-person report. */
export async function reportLostPerson(
  data: Omit<LostPerson, 'id' | 'reported_at' | 'timeline_json' | 'search_recommendations'>,
): Promise<LostPerson> {
  return apiFetch<LostPerson>('/lost-persons/', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Notification Endpoints ──────────────────────────────────────────────────

/** Fetch all notifications for the current session role. */
export async function getNotifications(): Promise<Notification[]> {
  return apiFetch<Notification[]>('/notifications/');
}

// ─── Auth Endpoint ───────────────────────────────────────────────────────────

/** Authenticate a user and return their profile. */
export async function loginUser(
  username: string,
  password: string,
): Promise<User> {
  return apiFetch<User>('/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}
