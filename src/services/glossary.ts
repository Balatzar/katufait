import { join, dirname } from "path";

export interface GlossaryTerm {
  term: string;
  description: string;
}

const GLOSSARY_PATH = join(dirname(dirname(dirname(import.meta.path))), "glossary.md");

export const loadGlossary = async (): Promise<GlossaryTerm[]> => {
  const file = Bun.file(GLOSSARY_PATH);
  
  if (!(await file.exists())) {
    return [];
  }
  
  const content = await file.text();
  const terms: GlossaryTerm[] = [];
  
  // Parse markdown list items: - **Term**: Description
  const regex = /^-\s+\*\*(.+?)\*\*:\s*(.+)$/gm;
  let match;
  
  while ((match = regex.exec(content)) !== null) {
    terms.push({
      term: match[1]!.trim(),
      description: match[2]!.trim(),
    });
  }
  
  return terms;
};

export const formatGlossaryForPrompt = (terms: GlossaryTerm[]): string => {
  if (terms.length === 0) {
    return "";
  }
  
  const termsList = terms
    .map((t) => `- "${t.term}": ${t.description}`)
    .join("\n");
  
  return `
IMPORTANT: Here is a glossary of specific terms used by the user. If you encounter something that sounds phonetically similar to any of these terms but doesn't make sense in context, replace it with the correct term from this list:

${termsList}
`;
};



