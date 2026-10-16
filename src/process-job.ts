import type { AppConfig } from "./config.js";
import { ApplicationLedger, type ApplicationRecord, saveQueuedApplication } from "./applications.js";
import { createApplicationEmail, ensureCvExists, sendApplication } from "./email.js";
import type { ParsedJob } from "./jobs.js";

export async function processJob(config: AppConfig, job: ParsedJob): Promise<void> {
  await ensureCvExists(config.candidate.cvPath);
  const ledger = new ApplicationLedger(config.paths.ledger);
  const email = createApplicationEmail(job, config.candidate);

  for (const recipient of job.recipients) {
    if (await ledger.hasContacted(job, recipient)) {
      console.info(`Skipped duplicate application to ${recipient}.`);
      continue;
    }

    const id = `${job.id}-${recipient.replace(/[^a-z0-9]/gi, "_")}`;
    const createdAt = new Date().toISOString();
    const queued: ApplicationRecord = { id, jobId: job.id, recipient, title: job.title, status: "queued", createdAt };

    if (!config.delivery.autoSend) {
      const filePath = await saveQueuedApplication(config.paths.queue, { record: queued, subject: email.subject, text: email.text, job });
      await ledger.record(queued);
      console.info(`Queued review draft for ${recipient}: ${filePath}`);
      continue;
    }

    if (config.delivery.dailyLimit > 0 && (await ledger.sentToday()) >= config.delivery.dailyLimit) {
      console.warn(`Daily application limit (${config.delivery.dailyLimit}) reached; ${recipient} was not sent.`);
      continue;
    }

    try {
      await sendApplication(config, recipient, email);
      await ledger.record({ ...queued, status: "sent", sentAt: new Date().toISOString() });
      console.info(`Sent application to ${recipient} for “${job.title}”.`);
    } catch (error) {
      await ledger.record({ ...queued, status: "failed", error: error instanceof Error ? error.message : String(error) });
      console.error(`Could not send application to ${recipient}.`, error);
    }
  }
}
