import { join, dirname } from "path";
import { readdir } from "fs/promises";

const ENTRIES_DIR = join(dirname(dirname(dirname(import.meta.path))), "entries");

export interface Entry {
  date: string;
  dateFormatted: string;
  content: string;
  filePath: string;
}

const formatDate = (date: Date): string => {
  return date.toISOString().split("T")[0]!; // YYYY-MM-DD
};

const formatDateHuman = (date: Date): string => {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getFilePath = (date: string): string => {
  return join(ENTRIES_DIR, `${date}.md`);
};

export const saveEntry = async (content: string, date: Date = new Date()): Promise<string> => {
  const dateStr = formatDate(date);
  const dateHuman = formatDateHuman(date);
  const filePath = getFilePath(dateStr);
  
  // Check if entry already exists for today
  const existingFile = Bun.file(filePath);
  const exists = await existingFile.exists();
  
  let markdown: string;
  if (exists) {
    // Append to existing entry
    const existing = await existingFile.text();
    markdown = `${existing}\n\n## Added later\n\n${content}`;
  } else {
    // Create new entry
    markdown = `# ${dateHuman}\n\n${content}`;
  }
  
  await Bun.write(filePath, markdown);
  return filePath;
};

export const getEntry = async (date: string): Promise<Entry | null> => {
  const filePath = getFilePath(date);
  const file = Bun.file(filePath);
  
  if (!(await file.exists())) {
    return null;
  }
  
  const content = await file.text();
  const dateObj = new Date(date);
  
  return {
    date,
    dateFormatted: formatDateHuman(dateObj),
    content,
    filePath,
  };
};

export const getAllEntries = async (): Promise<Entry[]> => {
  try {
    const files = await readdir(ENTRIES_DIR);
    const mdFiles = files.filter((f) => f.endsWith(".md")).sort().reverse();
    
    const entries: Entry[] = [];
    for (const file of mdFiles) {
      const date = file.replace(".md", "");
      const entry = await getEntry(date);
      if (entry) {
        entries.push(entry);
      }
    }
    
    return entries;
  } catch {
    return [];
  }
};

export interface AnalyticsData {
  totalEntries: number;
  firstEntry: string | null;
  lastEntry: string | null;
  entriesThisWeek: number;
  entriesThisMonth: number;
  entriesByMonth: Record<string, number>;
}

export const formatMonthFrench = (yearMonth: string): string => {
  const [year, month] = yearMonth.split("-");
  const date = new Date(parseInt(year!), parseInt(month!) - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
};

export const getAnalytics = async (): Promise<AnalyticsData> => {
  const entries = await getAllEntries();
  
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      firstEntry: null,
      lastEntry: null,
      entriesThisWeek: 0,
      entriesThisMonth: 0,
      entriesByMonth: {},
    };
  }
  
  const dates = entries.map((e) => e.date).sort();
  const today = formatDate(new Date());
  const weekAgo = formatDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const monthStart = today.substring(0, 7); // YYYY-MM
  
  // Entries by month (keep YYYY-MM format for sorting, display converts to French)
  const entriesByMonth: Record<string, number> = {};
  for (const date of dates) {
    const month = date.substring(0, 7);
    entriesByMonth[month] = (entriesByMonth[month] || 0) + 1;
  }
  
  return {
    totalEntries: entries.length,
    firstEntry: dates[0] ?? null,
    lastEntry: dates[dates.length - 1] ?? null,
    entriesThisWeek: dates.filter((d) => d >= weekAgo).length,
    entriesThisMonth: entriesByMonth[monthStart] || 0,
    entriesByMonth,
  };
};

