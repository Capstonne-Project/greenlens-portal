/**
 * Notification SignalR — single place for hub config + connection.
 *
 * ┌─ Config (BE contract) ─────────────────────────────────────────────┐
 * │ URL:  {NEXT_PUBLIC_API_BASE_URL}/hubs/notifications  (không /v1)   │
 * │ Auth: JWT accessTokenFactory → ?access_token=…                     │
 * │ Event BE→FE: "ReceiveNotification"                                 │
 * │ Mark-read: vẫn REST (hub không có client→server method)            │
 * └────────────────────────────────────────────────────────────────────┘
 *
 * Bật: NEXT_PUBLIC_ENABLE_SIGNALR=true
 * Override URL (optional): NEXT_PUBLIC_NOTIFICATION_HUB_URL
 *
 * Race note: React Strict Mode + bell/nav cùng mount từng gọi stop() giữa negotiate
 * → "connection was stopped during negotiation". Fix: subscribe() + delayed stop.
 * auth:session: chỉ stop+start khi access JWT đổi (connectedWithToken) — tránh WS đôi lúc hydrate.
 */

import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
  type ILogger,
} from '@microsoft/signalr';
import { refreshSessionOnce } from '@/lib/api/core';
import type {
  NotificationHub,
  NotificationRealtimeEvent,
  NotificationRealtimeHandler,
  RealTimeNotificationPayload,
} from '@/lib/realtime/types';

const HUB_PATH = '/hubs/notifications';
const HUB_EVENT_RECEIVE = 'ReceiveNotification';
/** Strict Mode unmount→remount trong <250ms không được teardown WS. */
const STOP_DEBOUNCE_MS = 250;

export function isNotificationRealtimeEnabled(): boolean {
  return process.env.NEXT_PUBLIC_ENABLE_SIGNALR === 'true';
}

export function resolveNotificationHubUrl(): string {
  const override = trimUrl(process.env.NEXT_PUBLIC_NOTIFICATION_HUB_URL);
  if (override) return override.endsWith(HUB_PATH) ? override : `${override}${HUB_PATH}`;

  const apiBase = trimUrl(process.env.NEXT_PUBLIC_API_BASE_URL);
  if (apiBase) return `${apiBase}${HUB_PATH}`;

  if (typeof window !== 'undefined') {
    return `/proxy-api${HUB_PATH}`;
  }
  return `http://localhost:5162${HUB_PATH}`;
}

function trimUrl(url: string | undefined): string {
  return url?.trim().replace(/\/$/, '') ?? '';
}

function readAccessToken(): string {
  if (typeof window === 'undefined') return '';
  return (window as Window & { __authToken?: string }).__authToken ?? '';
}

function pickField(o: Record<string, unknown>, ...keys: string[]): unknown {
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(o, key) && o[key] !== undefined) {
      return o[key];
    }
  }
  return undefined;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'bigint') return String(value);
  return null;
}

function asIsoDate(value: unknown): string | null {
  if (typeof value === 'string' && value.length > 0) return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString();
  return null;
}

/**
 * Chuẩn hoá payload Hub → camelCase FE.
 * BE ASP.NET đôi khi gửi PascalCase (Id, Type, …) dù doc nói camelCase.
 */
function normalizeRealtimePayload(raw: unknown): RealTimeNotificationPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;

  const id = asNonEmptyString(pickField(o, 'id', 'Id'));
  const type = asString(pickField(o, 'type', 'Type'));
  const title = asString(pickField(o, 'title', 'Title'));
  const message = asString(pickField(o, 'message', 'Message'));
  const createdAt = asIsoDate(pickField(o, 'createdAt', 'CreatedAt'));
  const refRaw = pickField(o, 'referenceId', 'ReferenceId');

  let referenceId: string | null = null;
  if (refRaw === null || refRaw === undefined) {
    referenceId = null;
  } else {
    referenceId = asNonEmptyString(refRaw) ?? String(refRaw);
  }

  if (!id || type === null || title === null || message === null || !createdAt) {
    return null;
  }

  return { id, type, title, message, referenceId, createdAt };
}

/** Abort do stop() giữa negotiate — không phải lỗi auth / BE. */
function isNegotiationAbort(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /stopped during negotiation|invocation canceled|invocation cancelled/i.test(msg);
}

function isUnauthorizedError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? '');
  return /401|unauthorized|status code '401'/i.test(msg);
}

/** Bỏ log abort negotiate (Next overlay coi console.error là runtime error). */
class HubLogger implements ILogger {
  log(logLevel: LogLevel, message: string): void {
    if (isNegotiationAbort(message)) return;
    if (logLevel >= LogLevel.Warning) {
      console.warn(`[SignalR] ${message}`);
    }
  }
}

let sharedHub: SignalRNotificationHub | null = null;

export function createNotificationHub(): NotificationHub | null {
  if (!isNotificationRealtimeEnabled()) return null;
  if (typeof window === 'undefined') return null;

  if (!sharedHub) {
    sharedHub = new SignalRNotificationHub(resolveNotificationHubUrl());
  }
  return sharedHub;
}

export function resetNotificationHubForTests(): void {
  sharedHub = null;
}

class SignalRNotificationHub implements NotificationHub {
  private readonly connection: HubConnection;
  private readonly handlers = new Set<NotificationRealtimeHandler>();
  private consumers = 0;
  private startPromise: Promise<void> | null = null;
  private stopTimer: ReturnType<typeof setTimeout> | null = null;
  private authListenersBound = false;
  /** Tăng mỗi lần stop có chủ đích — start in-flight bỏ qua nếu generation lệch. */
  private runGeneration = 0;
  /** Access JWT gắn với connection đang Connected — tránh stop+start khi auth:session trùng token (hydrate). */
  private connectedWithToken: string | null = null;

  constructor(hubUrl: string) {
    this.connection = new HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => readAccessToken(),
        withCredentials: false,
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
      .configureLogging(new HubLogger())
      .build();

    this.connection.on(HUB_EVENT_RECEIVE, (raw: unknown) => {
      const notification = normalizeRealtimePayload(raw);
      if (!notification) return;
      this.emit({ kind: 'received', notification });
    });

    this.connection.onreconnected(() => {
      this.emit({ kind: 'connected', reason: 'reconnect' });
    });
  }

  subscribe(handler: NotificationRealtimeHandler): () => void {
    this.bindAuthLifecycle();
    this.handlers.add(handler);
    this.consumers += 1;

    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    void this.ensureStarted().catch(() => {
      // REST fallback — không crash UI
    });

    return () => {
      this.handlers.delete(handler);
      this.consumers = Math.max(0, this.consumers - 1);

      if (this.consumers > 0) return;

      if (this.stopTimer) clearTimeout(this.stopTimer);
      this.stopTimer = setTimeout(() => {
        this.stopTimer = null;
        if (this.consumers === 0) {
          void this.stopInternal();
        }
      }, STOP_DEBOUNCE_MS);
    };
  }

  private async ensureStarted(): Promise<void> {
    if (this.consumers === 0) return;

    if (this.connection.state === HubConnectionState.Connected) {
      if (!this.connectedWithToken) {
        this.connectedWithToken = readAccessToken() || null;
      }
      this.emit({ kind: 'connected', reason: 'start' });
      return;
    }

    if (this.startPromise) return this.startPromise;

    const generation = this.runGeneration;
    const pending = this.connectWithAuthRetry(generation).finally(() => {
      // Chỉ clear nếu vẫn là promise này — tránh xoá start mới hơn sau stop∩remount
      if (this.startPromise === pending) this.startPromise = null;
    });
    this.startPromise = pending;
    return pending;
  }

  private async stopInternal(): Promise<void> {
    this.runGeneration += 1;
    this.connectedWithToken = null;

    if (this.connection.state === HubConnectionState.Disconnected) return;

    try {
      await this.connection.stop();
    } catch {
      // teardown
    }
  }

  private markConnected(): void {
    this.connectedWithToken = readAccessToken() || null;
    this.emit({ kind: 'connected', reason: 'start' });
  }

  private async connectWithAuthRetry(generation: number): Promise<void> {
    if (!readAccessToken()) {
      throw new Error('Notification hub: missing access token');
    }
    if (generation !== this.runGeneration || this.consumers === 0) return;

    try {
      await this.connection.start();
      if (generation !== this.runGeneration || this.consumers === 0) {
        await this.connection.stop().catch(() => undefined);
        return;
      }
      this.markConnected();
      return;
    } catch (firstError) {
      if (generation !== this.runGeneration || this.consumers === 0) return;
      if (isNegotiationAbort(firstError)) return;

      // Chỉ refresh khi thật sự 401 — không nhầm abort negotiate thành auth fail
      if (!isUnauthorizedError(firstError)) {
        throw firstError;
      }

      const refreshed = await refreshSessionOnce();
      if (!refreshed || !readAccessToken()) throw firstError;
      if (generation !== this.runGeneration || this.consumers === 0) return;

      if (this.connection.state !== HubConnectionState.Disconnected) {
        await this.connection.stop().catch(() => undefined);
      }
      if (generation !== this.runGeneration || this.consumers === 0) return;

      await this.connection.start();
      if (generation !== this.runGeneration || this.consumers === 0) {
        await this.connection.stop().catch(() => undefined);
        return;
      }
      this.markConnected();
    }
  }

  private bindAuthLifecycle(): void {
    if (this.authListenersBound || typeof window === 'undefined') return;
    this.authListenersBound = true;

    window.addEventListener('auth:logout', () => {
      this.consumers = 0;
      if (this.stopTimer) {
        clearTimeout(this.stopTimer);
        this.stopTimer = null;
      }
      void this.stopInternal();
    });

    window.addEventListener('auth:session', () => {
      void this.onSessionRefreshed();
    });
  }

  /**
   * Sau silent refresh / migrate:
   * - Đang Connected cùng token → no-op (tránh WS đôi lúc hard reload).
   * - Token đổi trong lúc Connected → stop+start để hub nhận JWT mới.
   * - Disconnected → ensureStarted.
   */
  private async onSessionRefreshed(): Promise<void> {
    if (this.consumers === 0) return;

    if (this.startPromise) {
      await this.startPromise.catch(() => undefined);
    }
    if (this.consumers === 0) return;

    const nextToken = readAccessToken();
    if (!nextToken) return;

    if (this.connection.state === HubConnectionState.Connected) {
      if (this.connectedWithToken === nextToken) return;

      try {
        const generation = this.runGeneration;
        await this.connection.stop();
        this.connectedWithToken = null;
        if (this.consumers === 0 || generation !== this.runGeneration) return;
        await this.connection.start();
        if (this.consumers === 0) {
          await this.connection.stop().catch(() => undefined);
          return;
        }
        this.connectedWithToken = nextToken;
        this.emit({ kind: 'connected', reason: 'reconnect' });
      } catch (error) {
        if (isNegotiationAbort(error)) return;
        await this.ensureStarted().catch(() => undefined);
      }
      return;
    }

    if (this.connection.state === HubConnectionState.Disconnected) {
      await this.ensureStarted().catch(() => undefined);
    }
  }

  private emit(event: NotificationRealtimeEvent): void {
    this.handlers.forEach(handler => {
      try {
        handler(event);
      } catch {
        // isolate handler errors
      }
    });
  }
}
