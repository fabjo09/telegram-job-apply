import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { TelegramClient } from "teleproto";
import { StringSession } from "teleproto/sessions";
import { NewMessage } from "teleproto/events";
import type { TelegramConfig, TelegramSessionConfig } from "./config.js";

export function createTelegramClient(config: TelegramSessionConfig): TelegramClient {
  return new TelegramClient(new StringSession(config.session), config.apiId, config.apiHash, {
    connectionRetries: 5,
  });
}

export async function authenticate(client: TelegramClient): Promise<void> {
  const terminal = createInterface({ input, output });
  try {
    await client.start({
      phoneNumber: () => terminal.question("Telegram phone number: "),
      password: () => terminal.question("Telegram 2FA password: "),
      phoneCode: () => terminal.question("Telegram sign-in code: "),
      emailAddress: () => terminal.question("Telegram login email (if requested): "),
      emailVerification: async () => ({ type: "code", code: await terminal.question("Telegram email code: ") }),
      onError: console.error,
    });
  } finally {
    terminal.close();
  }
}

export async function logInAndPrintSession(config: Pick<TelegramConfig, "apiId" | "apiHash">): Promise<void> {
  const client = new TelegramClient(new StringSession(""), config.apiId, config.apiHash, { connectionRetries: 5 });
  await authenticate(client);
  console.log("\nSave this value as TELEGRAM_SESSION in your .env file. Do not share it:");
  console.log(client.session.save());
  await client.disconnect();
}

export function listenForGroupMessages(
  client: TelegramClient,
  group: string,
  onMessage: (sourceMessageId: string, text: string) => Promise<void>,
): void {
  client.addEventHandler(
    async (event) => {
      const text = event.message.message;
      if (!text) return;
      await onMessage(`${group}:${event.message.id}`, text);
    },
    new NewMessage({ chats: [group], incoming: true }),
  );
}
