import { getAllEntries } from "../services/storage";

export const dailyCommand = async () => {
  const entries = await getAllEntries();
  const entry = entries[0];

  if (!entry) {
    console.log("Aucune entrée. Lance `katufait record` pour en créer une.");
    return;
  }

  console.log(`\n📅 ${entry.dateFormatted}\n`);
  const lines = entry.content.split("\n").slice(2).join("\n").trim();
  console.log(lines);
  console.log();
};
