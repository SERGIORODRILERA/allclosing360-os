import { connect, StringCodec, type NatsConnection } from "nats";

let _connection: NatsConnection | null = null;

export const sc = StringCodec();

export async function getConnection(): Promise<NatsConnection> {
  if (_connection === null || _connection.isClosed()) {
    const servers = process.env["NATS_URL"] ?? "nats://localhost:4222";
    _connection = await connect({ servers });

    void _connection.closed().then(() => {
      _connection = null;
    });
  }
  return _connection;
}

export async function closeConnection(): Promise<void> {
  if (_connection !== null) {
    await _connection.drain();
    _connection = null;
  }
}
