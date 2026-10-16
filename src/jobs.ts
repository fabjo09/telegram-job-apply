import { createHash } from "node:crypto";

export type ParsedJob = Readonly<{
  id: string;
  sourceMessageId: string;
  rawText: string;
  title: string;
  company?: string;
  recipients: string[];
  location?: string;
}>;

const EMAIL = /(?<![\w.+-])[\w.+-]+@[\w-]+(?:\.[\w-]+)+(?![\w.+-])/gi;

export function cleanTelegramText(text: string): string {
  return text
    .replace(/&#x20;|&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\\\n/g, "\n")
    .replace(/\\/g, "")
    .replace(/\*\*/g, "")
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleFrom(text: string): string | undefined {
  const hiring = text.match(/(?:we(?:['\u2019])?re\s+hiring|hiring)\s*:\s*([^\n]+)/i)?.[1];
  const position = text.match(/(?:position|role)\s*:\s*([^\n]+)/i)?.[1];
  const remoteJob = text.match(/(?:remote\s+job|job\s+(?:opening|opportunity)|vacancy)\s*[|:\-\u2013\u2014]\s*([^\n]+)/i)?.[1];
  const value = hiring ?? position ?? remoteJob;
  return value?.replace(/^[^A-Za-z0-9]+/, "").trim();
}

function companyFrom(text: string): string | undefined {
  return text.match(/(?:company|organisation|organization)\s*:\s*([^\n]+)/i)?.[1]?.trim();
}

function locationFrom(text: string): string | undefined {
  return text.match(/(?:work mode|location)\s*:\s*([^\n]+)/i)?.[1]?.trim();
}

export function parseJob(sourceMessageId: string, incomingText: string): ParsedJob | undefined {
  const rawText = cleanTelegramText(incomingText);
  const recipients = [...new Set([...rawText.matchAll(EMAIL)].map((match) => match[0].toLowerCase()))];
  if (recipients.length === 0) return undefined;
  const title = titleFrom(rawText) ?? "Software Developer";

  const id = createHash("sha256")
    .update(`${sourceMessageId}:${recipients.join(",")}:${title.toLowerCase()}`)
    .digest("hex")
    .slice(0, 20);

  return {
    id,
    sourceMessageId,
    rawText,
    title,
    company: companyFrom(rawText),
    recipients,
    location: locationFrom(rawText),
  };
}
