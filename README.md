# Katufait

A voice-based TUI app for recording what you did today. Uses OpenAI Whisper for transcription and GPT-4o-mini to clean and format your notes into beautiful markdown entries.

## Prerequisites

1. **sox** - for audio recording
   ```bash
   brew install sox
   ```

2. **OpenAI API Key** - create a `.env` file:
   ```
   OPENAI_API_KEY=sk-your-key-here
   ```

## Installation

```bash
bun install
```

## Usage

### Record an entry

```bash
bun run index.ts record
```

1. Press **SPACE** to start recording
2. Speak about what you did today
3. Press **SPACE** to stop
4. Wait for transcription and formatting
5. Entry is saved to `entries/YYYY-MM-DD.md`

### List entries

```bash
bun run index.ts list
```

- Use **↑↓** to navigate
- Press **Enter** to view an entry
- Press **ESC** to go back
- Press **q** to quit

### View analytics

```bash
bun run index.ts analytics
```

Shows:
- Total entries
- Current and longest streaks
- Entries this week/month
- Bar chart of entries by month

## Project Structure

```
katufait/
├── index.ts              # CLI entry point
├── src/
│   ├── commands/         # CLI commands (record, list, analytics)
│   ├── services/         # Business logic (openai, recorder, storage)
│   └── components/       # Ink React components
├── entries/              # Your recorded entries (YYYY-MM-DD.md)
└── .env                  # Your OpenAI API key
```
