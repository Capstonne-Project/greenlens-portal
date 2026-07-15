import {
  HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from '@microsoft/signalr';
import { buildNotificationHubUrl } from '@/lib/realtime/getHubBaseUrl';

export type ReceiveNotificationPayload = {
  id?: string;
  title?: string;
  body?: string;
  type?: string;
  createdAt?: string;
  [key: string]: unknown;
};

export type NotificationReceivedHandler = (payload: ReceiveNotificationPayload) => void;

let connection: HubConnection | null = null;

/** Create (or reuse) NotificationHub connection — JWT via ?access_token=. */
export function getOrCreateNotificationHub(accessToken: string): HubConnection | null {
  const url = buildNotificationHubUrl(accessToken);
  if (!url) return null;

  if (connection) {
    return connection;
  }

  connection = new HubConnectionBuilder()
    .withUrl(url)
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(
      process.env.NODE_ENV === 'production' ? LogLevel.Warning : LogLevel.Information
    )
    .build();

  return connection;
}

export async function startNotificationHub(
  accessToken: string,
  onReceive: NotificationReceivedHandler
): Promise<HubConnection | null> {
  await stopNotificationHub();

  const hub = getOrCreateNotificationHub(accessToken);
  if (!hub) return null;

  hub.off('ReceiveNotification');
  hub.on('ReceiveNotification', (payload: ReceiveNotificationPayload) => {
    onReceive(payload ?? {});
  });

  if (hub.state === HubConnectionState.Disconnected) {
    await hub.start();
  }

  return hub;
}

export async function stopNotificationHub(): Promise<void> {
  if (!connection) return;
  const hub = connection;
  connection = null;
  try {
    hub.off('ReceiveNotification');
    if (hub.state !== HubConnectionState.Disconnected) {
      await hub.stop();
    }
  } catch {
    // ignore teardown errors
  }
}
