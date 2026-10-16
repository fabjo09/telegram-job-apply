import { describe, expect, it } from "vitest";
import { cleanTelegramText, parseJob } from "../src/jobs.js";

const fullStackPost = `🚨 **WE’RE HIRING: PART-TIME FULL STACK DEVELOPER**\\
🌍 **WORK MODE: REMOTE&#x20;**\\
**How to Apply**\\
📩 Email your updated resume and portfolio to:\\
✉️ marktomake24@gmail.com`;

const reactPost = `**WE’RE HIRING: REACT FRONTEND DEVELOPER**\\
**Position:** React Frontend Developer\\
**Location:** Remote\\
**Email:** abhishek.pandey@hipathtech.com`;

const remoteDotNetPost = `REMOTE JOB | SENIOR .NET DEVELOPER
Company: BookingLane
Work Mode: 100% Remote
Experience: 4+ Years
Required Skills: C#, .NET, ASP.NET Core, REST APIs, PostgreSQL, Docker
HOW TO APPLY
Apply through the official application form.
Contact Email: saita@bookinglane.com`;

describe("Telegram job parser", () => {
  it("cleans Telegram formatting without losing content", () => {
    expect(cleanTelegramText(fullStackPost)).toContain("WORK MODE: REMOTE");
  });

  it("extracts a full-stack job and application email", () => {
    expect(parseJob("group:11", fullStackPost)).toMatchObject({
      title: "PART-TIME FULL STACK DEVELOPER",
      recipients: ["marktomake24@gmail.com"],
    });
  });

  it("extracts a React job", () => {
    const job = parseJob("group:12", reactPost);
    expect(job).toMatchObject({
      title: "REACT FRONTEND DEVELOPER",
      recipients: ["abhishek.pandey@hipathtech.com"],
    });
  });

  it("uses every email in a message", () => {
    const post = `WE'RE HIRING: REACT DEVELOPER\nCompany contact: hello@example.org\nHow to Apply\nSend your CV to recruiting@example.com`;
    expect(parseJob("group:13", post)?.recipients).toEqual(["hello@example.org", "recruiting@example.com"]);
  });

  it("extracts a remote-job heading and its contact email", () => {
    const job = parseJob("group:14", remoteDotNetPost);
    expect(job).toMatchObject({
      title: "SENIOR .NET DEVELOPER",
      company: "BookingLane",
      recipients: ["saita@bookinglane.com"],
    });
  });

  it("creates a generic application target when a message has only an email", () => {
    expect(parseJob("group:15", "Contact hiring@example.com for details.")).toMatchObject({
      title: "Software Developer",
      recipients: ["hiring@example.com"],
    });
  });
});
