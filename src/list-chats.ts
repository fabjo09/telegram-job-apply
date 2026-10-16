import { loadTelegramSessionConfig } from "./config.js";
import { createTelegramClient } from "./telegram.js";

const client = createTelegramClient(loadTelegramSessionConfig());

try {
  await client.connect();
  const dialogs = await client.getDialogs({});
  console.log("Copy the value after TELEGRAM_GROUP= for the job group you want to monitor:\n");

  for (const dialog of dialogs) {
    if (!dialog.isGroup && !dialog.isChannel) continue;
    const username = (dialog.entity as { username?: string } | undefined)?.username;
    const identifier = username ? `@${username}` : (await client.getPeerId(dialog.inputEntity)).toString();
    const kind = dialog.isChannel ? "channel" : "group";
    console.log(`[${kind}] ${dialog.title ?? "Untitled"}`);
    console.log(`TELEGRAM_GROUP=${identifier}\n`);
  }
} finally {
  await client.disconnect();
}
