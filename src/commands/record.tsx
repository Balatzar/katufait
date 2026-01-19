import React from "react";
import { render } from "ink";
import { VoiceRecorder } from "../components/VoiceRecorder";

export const recordCommand = async () => {
  const { waitUntilExit } = render(<VoiceRecorder />);
  await waitUntilExit();
};



