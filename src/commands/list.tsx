import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import { getAllEntries, type Entry } from "../services/storage";

const EntryList = () => {
  const { exit } = useApp();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    getAllEntries().then((e) => {
      setEntries(e);
      setLoading(false);
    });
  }, []);

  useInput((input, key) => {
    if (key.escape) {
      if (showContent) {
        setShowContent(false);
      } else {
        exit();
      }
      return;
    }

    if (key.return && entries.length > 0) {
      setShowContent(!showContent);
      return;
    }

    if (key.upArrow && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
    if (key.downArrow && selectedIndex < entries.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }

    if (input === "q") {
      exit();
    }
  });

  if (loading) {
    return (
      <Box padding={1}>
        <Text><Text color="blue">⏳</Text> Loading entries...</Text>
      </Box>
    );
  }

  if (entries.length === 0) {
    return (
      <Box padding={1} flexDirection="column">
        <Text bold color="cyan">📋 Entries</Text>
        <Box marginTop={1}>
          <Text dimColor>No entries yet. Run <Text bold>katufait record</Text> to create one.</Text>
        </Box>
      </Box>
    );
  }

  const selectedEntry = entries[selectedIndex];

  return (
    <Box padding={1} flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">📋 Entries ({entries.length} total)</Text>
      </Box>

      {!showContent ? (
        <>
          <Box flexDirection="column">
            {entries.map((entry, i) => (
              <Box key={entry.date}>
                <Text color={i === selectedIndex ? "green" : undefined}>
                  {i === selectedIndex ? "▸ " : "  "}
                  <Text bold={i === selectedIndex}>{entry.date}</Text>
                  <Text dimColor> - {entry.dateFormatted}</Text>
                </Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1}>
            <Text dimColor>↑↓ navigate • Enter view • q quit</Text>
          </Box>
        </>
      ) : selectedEntry ? (
        <>
          <Box marginBottom={1}>
            <Text bold>{selectedEntry.dateFormatted}</Text>
          </Box>
          <Box borderStyle="round" borderColor="green" padding={1} flexDirection="column">
            <Text>{selectedEntry.content}</Text>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>ESC back • q quit</Text>
          </Box>
        </>
      ) : null}
    </Box>
  );
};

export const listCommand = async () => {
  const { waitUntilExit } = render(<EntryList />);
  await waitUntilExit();
};

