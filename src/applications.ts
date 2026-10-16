import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { ParsedJob } from "./jobs.js";

export type ApplicationStatus = "queued" | "sent" | "failed";

export type ApplicationRecord = Readonly<{
  id: string;
  jobId: string;
  recipient: string;
  title: string;
  status: ApplicationStatus;
  createdAt: string;
  sentAt?: string;
  error?: string;
}>;

export class ApplicationLedger {
  constructor(private readonly filePath: string) {}

  async all(): Promise<ApplicationRecord[]> {
    try {
      return JSON.parse(await readFile(this.filePath, "utf8")) as ApplicationRecord[];
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return [];
      throw error;
    }
  }

  async hasContacted(job: ParsedJob, recipient: string): Promise<boolean> {
    return (await this.all()).some((record) => record.jobId === job.id && record.recipient === recipient);
  }

  async sentToday(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    return (await this.all()).filter((record) => record.status === "sent" && record.sentAt?.startsWith(today)).length;
  }

  async record(record: ApplicationRecord): Promise<void> {
    const existing = await this.all();
    existing.push(record);
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(existing, null, 2)}\n`, "utf8");
  }
}

export async function saveQueuedApplication(
  queueDirectory: string,
  application: { record: ApplicationRecord; subject: string; text: string; job: ParsedJob },
): Promise<string> {
  await mkdir(queueDirectory, { recursive: true });
  const filePath = path.join(queueDirectory, `${application.record.id}.json`);
  await writeFile(filePath, `${JSON.stringify(application, null, 2)}\n`, "utf8");
  return filePath;
}
