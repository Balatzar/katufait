import { $ } from "bun";
import { tmpdir } from "os";
import { join } from "path";

export interface RecordingSession {
  tempFile: string;
  process: Bun.Subprocess | null;
}

let currentSession: RecordingSession | null = null;

export const startRecording = async (): Promise<string> => {
  const tempFile = join(tmpdir(), `katufait-${Date.now()}.wav`);
  
  // Start sox recording in background
  // -d uses default audio device, -c 1 mono, -r 16000 sample rate (good for speech)
  const process = Bun.spawn(["rec", "-c", "1", "-r", "16000", tempFile], {
    stdout: "ignore",
    stderr: "ignore",
  });
  
  currentSession = { tempFile, process };
  return tempFile;
};

export const stopRecording = async (): Promise<string | null> => {
  if (!currentSession) {
    return null;
  }
  
  const { tempFile, process } = currentSession;
  
  if (process) {
    // Send SIGTERM to stop recording gracefully
    process.kill("SIGTERM");
    await process.exited;
  }
  
  currentSession = null;
  return tempFile;
};

export const isRecording = (): boolean => {
  return currentSession !== null;
};

export const checkSoxInstalled = async (): Promise<boolean> => {
  try {
    await $`which rec`.quiet();
    return true;
  } catch {
    return false;
  }
};



