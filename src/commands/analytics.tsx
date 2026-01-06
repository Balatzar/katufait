import React, { useState, useEffect } from "react";
import { render, Box, Text, useInput, useApp } from "ink";
import { getAnalytics, formatMonthFrench, type AnalyticsData } from "../services/storage";

const AnalyticsDisplay = () => {
  const { exit } = useApp();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then((data) => {
      setAnalytics(data);
      setLoading(false);
    });
  }, []);

  useInput((input, key) => {
    if (input === "q" || key.escape) {
      exit();
    }
  });

  if (loading) {
    return (
      <Box padding={1}>
        <Text><Text color="blue">⏳</Text> Loading analytics...</Text>
      </Box>
    );
  }

  if (!analytics || analytics.totalEntries === 0) {
    return (
      <Box padding={1} flexDirection="column">
        <Text bold color="cyan">📊 Statistiques</Text>
        <Box marginTop={1}>
          <Text dimColor>Aucune entrée. Lancez <Text bold>katufait record</Text> pour en créer une.</Text>
        </Box>
      </Box>
    );
  }

  const recentMonths = Object.entries(analytics.entriesByMonth)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 6);

  return (
    <Box padding={1} flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">📊 Statistiques</Text>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Box>
          <Text>Entrées totales : </Text>
          <Text bold color="green">{analytics.totalEntries}</Text>
        </Box>
        <Box>
          <Text>Première entrée : </Text>
          <Text bold>{analytics.firstEntry || "N/A"}</Text>
        </Box>
        <Box>
          <Text>Dernière entrée : </Text>
          <Text bold>{analytics.lastEntry || "N/A"}</Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="yellow">Activité récente</Text>
        <Box>
          <Text>Cette semaine : </Text>
          <Text bold>{analytics.entriesThisWeek} entrées</Text>
        </Box>
        <Box>
          <Text>Ce mois : </Text>
          <Text bold>{analytics.entriesThisMonth} entrées</Text>
        </Box>
      </Box>

      {recentMonths.length > 0 && (
        <Box flexDirection="column">
          <Text bold color="yellow">Entrées par mois</Text>
          {recentMonths.map(([month, count]) => (
            <Box key={month}>
              <Text>{formatMonthFrench(month)} : </Text>
              <Text bold>{count}</Text>
              <Text> </Text>
              <Text color="green">{"█".repeat(Math.min(count, 20))}</Text>
            </Box>
          ))}
        </Box>
      )}

      <Box marginTop={1}>
        <Text dimColor>Appuyer sur q ou ESC pour quitter</Text>
      </Box>
    </Box>
  );
};

export const analyticsCommand = async () => {
  const { waitUntilExit } = render(<AnalyticsDisplay />);
  await waitUntilExit();
};

