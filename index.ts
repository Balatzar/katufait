#!/usr/bin/env bun
import { join } from "path";

// Load .env from the project directory (not cwd)
const projectDir = import.meta.dir;
const envPath = join(projectDir, ".env");
const envFile = Bun.file(envPath);
if (await envFile.exists()) {
  const envContent = await envFile.text();
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join("=").trim();
      }
    }
  }
}

import { program } from "commander";
import { recordCommand } from "./src/commands/record";
import { listCommand } from "./src/commands/list";
import { analyticsCommand } from "./src/commands/analytics";
import { dailyCommand } from "./src/commands/daily";

program
  .name("katufait")
  .description("Voice-based daily activity recorder")
  .version("1.0.0");

program
  .command("record")
  .description("Record what you did today using voice")
  .action(recordCommand);

program
  .command("list")
  .description("List all recorded entries")
  .action(listCommand);

program
  .command("analytics")
  .description("Show statistics about your entries")
  .action(analyticsCommand);

program
  .command("daily")
  .description("Show the latest entry")
  .action(dailyCommand);

program.parse();
