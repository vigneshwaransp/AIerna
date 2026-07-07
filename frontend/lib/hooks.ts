// ─────────────────────────────────────────────────────────────────────────────
// AIrena Smart Tournament Operations Platform
// Custom React Hooks — lib/hooks.ts
// ─────────────────────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  getZones,
  getIncidents,
  getNotifications,
  type Zone,
  type Incident,
  type Notification,
} from './api';

// ─────────────────────────────────────────────────────────────────────────────
// useWebSocket
// ─────────────────────────────────────────────────────────────────────────────

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected';

export interface UseWebSocketReturn {
  lastMessage: unknown;
  connectionStatus: ConnectionStatus;
}

/**
 * Establishes a persistent WebSocket connection with automatic reconnection
 * using exponential backoff (max ~30 s between attempts).
 *
 * @param url - The full WebSocket URL, e.g. ws://localhost:8000/ws/telemetry
 */
export function useWebSocket(url: string): UseWebSocketReturn {
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('connecting');

  // Stable refs so the effect closure always sees current values
  const wsRef        = useRef<WebSocket | null>(null);
  const retryCount   = useRef<number>(0);
  const retryTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted    = useRef<boolean>(true);

  const connect = useCallback(() => {
    if (!isMounted.current) return;

    setConnectionStatus('connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (!isMounted.current) return;
      retryCount.current = 0;
      setConnectionStatus('connected');
    };

    ws.onmessage = (event: MessageEvent) => {
      if (!isMounted.current) return;
      try {
        const parsed: unknown = JSON.parse(event.data as string);
        setLastMessage(parsed);
      } catch {
        // If the payload is not JSON, expose it as a raw string
        setLastMessage(event.data);
      }
    };

    ws.onclose = () => {
      if (!isMounted.current) return;
      setConnectionStatus('disconnected');

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s … capped at 30s
      const delay = Math.min(1000 * 2 ** retryCount.current, 30_000);
      retryCount.current += 1;

      retryTimeout.current = setTimeout(() => {
        if (isMounted.current) connect();
      }, delay);
    };

    ws.onerror = () => {
      // Let onclose handle the reconnect logic
      ws.close();
    };
  }, [url]);

  useEffect(() => {
    isMounted.current = true;
    connect();

    return () => {
      isMounted.current = false;

      if (retryTimeout.current !== null) {
        clearTimeout(retryTimeout.current);
      }

      if (wsRef.current) {
        // Remove handlers before closing to prevent spurious reconnects
        wsRef.current.onclose = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { lastMessage, connectionStatus };
}

// ─────────────────────────────────────────────────────────────────────────────
// useZones
// ─────────────────────────────────────────────────────────────────────────────

export interface UseZonesReturn {
  zones: Zone[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches all venue zones and polls every 5 seconds for live capacity updates.
 */
export function useZones(): UseZonesReturn {
  const [zones, setZones]     = useState<Zone[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError]     = useState<string | null>(null);

  const fetchZones = useCallback(async () => {
    try {
      const data = await getZones();
      setZones(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch zones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchZones();
    const interval = setInterval(() => void fetchZones(), 5_000);
    return () => clearInterval(interval);
  }, [fetchZones]);

  return { zones, loading, error, refetch: fetchZones };
}

// ─────────────────────────────────────────────────────────────────────────────
// useIncidents
// ─────────────────────────────────────────────────────────────────────────────

export interface UseIncidentsReturn {
  incidents: Incident[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Fetches all incidents and polls every 10 seconds.
 */
export function useIncidents(): UseIncidentsReturn {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading]     = useState<boolean>(true);
  const [error, setError]         = useState<string | null>(null);

  const fetchIncidents = useCallback(async () => {
    try {
      const data = await getIncidents();
      setIncidents(data);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch incidents',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchIncidents();
    const interval = setInterval(() => void fetchIncidents(), 10_000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  return { incidents, loading, error, refetch: fetchIncidents };
}

// ─────────────────────────────────────────────────────────────────────────────
// useNotifications
// ─────────────────────────────────────────────────────────────────────────────

export interface UseNotificationsReturn {
  notifications: Notification[];
  loading: boolean;
  unreadCount: number;
}

/**
 * Fetches notifications and exposes an unread count derived from the payload.
 * Polls every 15 seconds to stay current without hammering the server.
 */
export function useNotifications(): UseNotificationsReturn {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
    } catch {
      // Silently swallow notification errors; non-critical feature
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 15_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return { notifications, loading, unreadCount };
}
