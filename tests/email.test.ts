import { describe, expect, it } from "vitest";
import { createApplicationEmail } from "../src/email.js";
import type { ParsedJob } from "../src/jobs.js";

const candidate = {
  name: "Fabjo Koci",
  email: "gfabjo@gmail.com",
  portfolio: "https://www.linkedin.com/in/fabjo-koci-82104023a/",
  highlights: "React, Angular, TypeScript, Node.js, .NET/C#, REST APIs",
  cvPath: "C:/cv.pdf",
};

function job(title: string): ParsedJob {
  return { id: "job", sourceMessageId: "group:1", rawText: title, title, recipients: ["jobs@example.com"] };
}

describe("application email", () => {
  it("uses React experience for a React role", () => {
    expect(createApplicationEmail(job("React Frontend Developer"), candidate).text).toContain("React and TypeScript");
  });

  it("uses .NET experience for a .NET role", () => {
    expect(createApplicationEmail(job(".NET Backend Developer"), candidate).text).toContain("Entity Framework Core");
  });

  it("uses full-stack experience for a full-stack role", () => {
    expect(createApplicationEmail(job("Full Stack Engineer"), candidate).text).toContain("professional full-stack experience");
  });
});
