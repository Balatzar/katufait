#!/usr/bin/env bun
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
