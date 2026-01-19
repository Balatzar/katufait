import React, { useState, useEffect } from "react";
import { Box, Text, useInput, useApp } from "ink";
import { startRecording, stopRecording, isRecording, checkSoxInstalled } from "../services/recorder";
import { transcribeAudio, formatWithGPT } from "../services/openai";
import { saveEntry } from "../services/storage";
import { unlink } from "fs/promises";

type RecordingState = "idle" | "recording" | "processing" | "transcribing" | "formatting" | "saving" | "done" | "error";

export const VoiceRecorder = () => {
  const { exit } = useApp();
  const [state, setState] = useState<RecordingState>("idle");
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

      // Save to file
      setState("saving");
      const path = await saveEntry(formattedText);
      setSavedPath(path);

      // Cleanup temp file
      await unlink(file);

      setState("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setState("error");
    }
  };

  useInput(async (input, key) => {
    if (state === "done" || state === "error") {
      exit();
      return;
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



