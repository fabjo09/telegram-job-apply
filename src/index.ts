import { loadConfig } from "./config.js";
import { parseJob } from "./jobs.js";
import { processJob } from "./process-job.js";
import { authenticate, createTelegramClient, listenForGroupMessages } from "./telegram.js";

const config = loadConfig();
const client = createTelegramClient(config.telegram);

await authenticate(client);
console.log(`Monitoring ${config.telegram.group}. Mode: ${config.delivery.autoSend ? "AUTO-SEND" : "REVIEW ONLY"}.`);

listenForGroupMessages(client, config.telegram.group, async (sourceMessageId, text) => {
  const job = parseJob(sourceMessageId, text);
  if (!job) {
    console.info("Ignored Telegram message: no email address found.");
    return;
  }
  console.info(`Found “${job.title}” with ${job.recipients.length} email contact(s).`);
  await processJob(config, job);
});

// Keep the MTProto connection open to receive new messages.
await new Promise<void>(() => undefined);
