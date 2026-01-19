import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { startRecording, stopRecording, isRecording, checkSoxInstalled } from "../services/recorder";
import { transcribeAudio, formatWithGPT } from "../services/openai";
import { saveEntry } from "../services/storage";
import { unlink } from "fs/promises";

type RecordingState = "selecting-day" | "idle" | "recording" | "processing" | "transcribing" | "formatting" | "saving" | "done" | "error";

export const VoiceRecorder = () => {
  const { exit } = useApp();
  const [state, setState] = useState<RecordingState>("idle");
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioFile, setAudioFile] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string | null>(null);
  const [formatted, setFormatted] = useState<string | null>(null);
  const [savedPath, setSavedPath] = useState<string | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Check sox on mount
  useEffect(() => {
    checkSoxInstalled().then((installed) => {
      if (!installed) {
        setError("sox is not installed. Please run: brew install sox");
        setState("error");
      }
    });
  }, []);

  // Recording timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (state === "recording") {
      interval = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state]);

  // Process after recording stops
  useEffect(() => {
    if (state === "processing" && audioFile) {
      processRecording(audioFile);
    }
  }, [state, audioFile]);

  const getSelectedDate = (): Date => {
    return new Date(Date.now() - selectedDayIndex * 24 * 60 * 60 * 1000);
  };

  const formatDateHuman = (date: Date): string => {
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getAvailableDays = (): Date[] => {
    const days: Date[] = [];
    for (let i = 0; i <= 7; i++) {
      days.push(new Date(Date.now() - i * 24 * 60 * 60 * 1000));
    }
    return days;
  };

  const processRecording = async (file: string) => {
    try {
      // Transcribe
      setState("transcribing");
      const text = await transcribeAudio(file);
      setTranscription(text);

      // Format with GPT
      setState("formatting");
      const formattedText = await formatWithGPT(text);
      setFormatted(formattedText);

      // Cleanup temp file
      await unlink(file);

      // Show day selection instead of saving immediately
      setState("selecting-day");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setState("error");
    }
  };

  const saveToSelectedDay = async () => {
    if (!formatted) return;
    
    try {
      setState("saving");
      const selectedDate = getSelectedDate();
      const path = await saveEntry(formatted, selectedDate);
      setSavedPath(path);
      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save entry");
      setState("error");
    }
  };

  useInput(async (input, key) => {
    if (state === "done" || state === "error") {
      exit();
      return;
    }

    if (state === "selecting-day") {
      if (key.downArrow && selectedDayIndex < 7) {
        setSelectedDayIndex(selectedDayIndex + 1);
        return;
      }
      if (key.upArrow && selectedDayIndex > 0) {
        setSelectedDayIndex(selectedDayIndex - 1);
        return;
      }
      if (input === " ") {
        await saveToSelectedDay();
        return;
      }
      if (key.escape) {
        exit();
        return;
      }
    }

    if (input === " ") {
      if (state === "idle") {
        // Start recording
        try {
          const file = await startRecording();
          setAudioFile(file);
          setRecordingTime(0);
          setState("recording");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Failed to start recording");
          setState("error");
        }
      } else if (state === "recording") {
        // Stop recording
        await stopRecording();
        setState("processing");
      }
    }

    if (key.escape) {
      if (state === "recording") {
        await stopRecording();
      }
      exit();
    }
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          🎙️ Katufait Voice Recorder
        </Text>
      </Box>

      {state === "selecting-day" && (
        <Box flexDirection="column">
          <Box marginBottom={1}>
            <Text bold color="cyan">Select day for entry:</Text>
          </Box>
          <Box flexDirection="column">
            {getAvailableDays().map((day, i) => (
              <Box key={i}>
                <Text color={i === selectedDayIndex ? "green" : undefined}>
                  {i === selectedDayIndex ? "▸ " : "  "}
                  <Text bold={i === selectedDayIndex}>{formatDateHuman(day)}</Text>
                </Text>
              </Box>
            ))}
          </Box>
          <Box marginTop={1}>
            <Text dimColor>↑↓ select day • SPACE to save • ESC to exit</Text>
          </Box>
        </Box>
      )}

      {state === "idle" && (
        <Box flexDirection="column">
          <Text>Press <Text bold color="green">SPACE</Text> to start recording</Text>
          <Text dimColor>Press ESC to exit</Text>
        </Box>
      )}

      {state === "recording" && (
        <Box flexDirection="column">
          <Text>
            <Text color="red">●</Text> Recording... <Text bold>{formatTime(recordingTime)}</Text>
          </Text>
          <Text>Press <Text bold color="yellow">SPACE</Text> to stop</Text>
        </Box>
      )}

      {state === "processing" && (
        <Text><Text color="blue">⏳</Text> Processing audio...</Text>
      )}

      {state === "transcribing" && (
        <Text><Text color="blue">⏳</Text> Transcribing with Whisper...</Text>
      )}

      {state === "formatting" && (
        <Box flexDirection="column">
          <Text><Text color="blue">⏳</Text> Formatting with GPT...</Text>
          {transcription && (
            <Box marginTop={1} flexDirection="column">
              <Text dimColor>Raw transcription:</Text>
              <Text>{transcription}</Text>
            </Box>
          )}
        </Box>
      )}

      {state === "saving" && (
        <Text><Text color="blue">⏳</Text> Saving entry...</Text>
      )}

      {state === "done" && (
        <Box flexDirection="column">
          <Text><Text color="green">✓</Text> Entry saved!</Text>
          <Box marginTop={1} flexDirection="column">
            <Text dimColor>Saved to: {savedPath}</Text>
            <Box marginTop={1} borderStyle="round" borderColor="green" padding={1} flexDirection="column">
              <Text>{formatted}</Text>
            </Box>
          </Box>
          <Box marginTop={1}>
            <Text dimColor>Press any key to exit</Text>
          </Box>
        </Box>
      )}

      {state === "error" && (
        <Box flexDirection="column">
          <Text><Text color="red">✗</Text> Error: {error}</Text>
          <Box marginTop={1}>
            <Text dimColor>Press any key to exit</Text>
          </Box>
        </Box>
      )}
    </Box>
  );
};



