import "dotenv/config";
import path from "node:path";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}. Copy .env.example to .env and fill it in.`);
  return value;
}

function nonNegativeInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative whole number.`);
  }
  return value;
}

export type TelegramConfig = Readonly<{
    apiId: number;
    apiHash: string;
    session: string;
    group: string;
}>;

export type TelegramSessionConfig = Pick<TelegramConfig, "apiId" | "apiHash" | "session">;

export type SmtpConfig = Readonly<{
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}>;

export type AppConfig = Readonly<{
  telegram: TelegramConfig;
  candidate: {
    name: string;
    email: string;
    portfolio?: string;
    highlights?: string;
    cvPath: string;
  };
  delivery: {
    autoSend: boolean;
    dailyLimit: number;
    smtp?: SmtpConfig;
  };
  paths: {
    ledger: string;
    queue: string;
  };
}>;

export function loadTelegramLoginConfig(): Pick<TelegramConfig, "apiId" | "apiHash"> {
  const apiId = Number.parseInt(required("TELEGRAM_API_ID"), 10);
  if (!Number.isSafeInteger(apiId) || apiId <= 0) {
    throw new Error("TELEGRAM_API_ID must be a positive number.");
  }
  return { apiId, apiHash: required("TELEGRAM_API_HASH") };
}

export function loadTelegramSessionConfig(): TelegramSessionConfig {
  return { ...loadTelegramLoginConfig(), session: required("TELEGRAM_SESSION") };
}

export function loadConfig(): AppConfig {
  const telegramSession = loadTelegramSessionConfig();
  const autoSend = process.env.AUTO_SEND === "true";
  const smtpNames = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "MAIL_FROM"] as const;
  const smtpConfigured = smtpNames.every((name) => Boolean(process.env[name]?.trim()));
  if (autoSend && !smtpConfigured) {
    throw new Error("AUTO_SEND=true requires SMTP_HOST, SMTP_USER, SMTP_PASS, and MAIL_FROM.");
  }

  const port = nonNegativeInteger("SMTP_PORT", 465);
  return {
    telegram: {
      ...telegramSession,
      group: required("TELEGRAM_GROUP"),
    },
    candidate: {
      name: required("CANDIDATE_NAME"),
      email: required("CANDIDATE_EMAIL"),
      portfolio: process.env.CANDIDATE_PORTFOLIO?.trim() || undefined,
      highlights: process.env.CANDIDATE_HIGHLIGHTS?.trim() || undefined,
      cvPath: path.resolve(required("CV_PATH")),
    },
    delivery: {
      autoSend,
      dailyLimit: nonNegativeInteger("APPLICATION_LIMIT_PER_DAY", 4),
      smtp: smtpConfigured ? {
        host: process.env.SMTP_HOST!.trim(),
        port,
        secure: process.env.SMTP_SECURE !== "false",
        user: process.env.SMTP_USER!.trim(),
        pass: process.env.SMTP_PASS!.trim(),
        from: process.env.MAIL_FROM!.trim(),
      } : undefined,
    },
    paths: {
      ledger: path.resolve("data", "applications.json"),
      queue: path.resolve("queue"),
    },
  };
}
