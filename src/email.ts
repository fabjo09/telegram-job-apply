import { access } from "node:fs/promises";
import nodemailer from "nodemailer";
import type { AppConfig } from "./config.js";
import type { ParsedJob } from "./jobs.js";

export type ApplicationEmail = Readonly<{ subject: string; text: string }>;

function relevantExperience(job: ParsedJob, fallback?: string): string {
  const text = `${job.title}\n${job.rawText}`.toLowerCase();
  if (/full[\s-]?stack/.test(text)) {
    return "I have professional full-stack experience across React, Angular, TypeScript, Node.js, .NET/C#, REST APIs, and SQL/NoSQL databases.";
  }
  if (/react/.test(text)) {
    return "I have professional experience building responsive React and TypeScript interfaces, reusable components and hooks, and REST API integrations.";
  }
  if (/angular/.test(text)) {
    return "I have professional experience building responsive Angular and TypeScript interfaces, including role-based workflows and REST API integrations.";
  }
  if (/\.net|asp\.net|dotnet|c#/.test(text)) {
    return "I have experience building .NET/C# REST APIs with Entity Framework Core, SQL Server, clean architecture patterns, and secure authentication workflows.";
  }
  if (/node\.?js|express(?:\.js)?|nestjs/.test(text)) {
    return "I have experience building Node.js and Express backends with REST APIs, authentication, PostgreSQL, and MongoDB.";
  }
  if (/back[\s-]?end/.test(text)) {
    return "I have backend experience with Node.js, .NET/C#, REST APIs, SQL Server, PostgreSQL, and MongoDB.";
  }
  if (/front[\s-]?end/.test(text)) {
    return "I have front-end experience with React, Angular, TypeScript, JavaScript, responsive UI development, and REST API integration.";
  }
  return fallback
    ? `My experience with ${fallback} is relevant to the skills requested for this role.`
    : "My web-development experience is relevant to the skills requested for this role.";
}

export function createApplicationEmail(job: ParsedJob, candidate: AppConfig["candidate"]): ApplicationEmail {
  const company = job.company ? ` at ${job.company}` : "";
  const portfolio = candidate.portfolio ? `\nPortfolio: ${candidate.portfolio}` : "";
  const highlights = relevantExperience(job, candidate.highlights);
  return {
    subject: `Application — ${job.title}`,
    text: `Dear Hiring Team,\n\nI am writing to apply for the ${job.title} position${company}. ${highlights}\n\nI have attached my CV for your consideration. I would welcome the opportunity to discuss how I could contribute to your team.\n\nKind regards,\n${candidate.name}\n${candidate.email}${portfolio}`,
  };
}

export async function ensureCvExists(cvPath: string): Promise<void> {
  try {
    await access(cvPath);
  } catch {
    throw new Error(`CV file not found: ${cvPath}`);
  }
}

export async function sendApplication(
  config: AppConfig,
  recipient: string,
  email: ApplicationEmail,
): Promise<void> {
  await ensureCvExists(config.candidate.cvPath);
  const smtp = config.delivery.smtp;
  if (!smtp) throw new Error("SMTP is not configured. Set SMTP values before enabling AUTO_SEND.");
  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });
  await transporter.sendMail({
    from: smtp.from,
    to: recipient,
    subject: email.subject,
    text: email.text,
    replyTo: config.candidate.email,
    attachments: [{ filename: "CV.pdf", path: config.candidate.cvPath }],
  });
}
