"use client";

import { useState, useRef, useEffect } from "react";
import { Typography, Button, Box, Paper } from "@mui/material";

export default function HomePage() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const audioRef = useRef(null);
  const wsRef = useRef(null);
  const recorderRef = useRef(null); // Store the MediaRecorder

  const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  const handleStartRecording = async () => {
    setTranscript("");
    setIsRecording(true);

    // Initialize WebSocket connection to Deepgram
    const deepgramSocket = new WebSocket(
      `wss://api.deepgram.com/v1/listen?punctuate=true`,
      ["token", DEEPGRAM_API_KEY]
    );

    wsRef.current = deepgramSocket;

    // Wait for WebSocket to open before sending audio data
    deepgramSocket.onopen = async () => {
      console.log("WebSocket connection established");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      recorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (deepgramSocket.readyState === WebSocket.OPEN) {
          deepgramSocket.send(event.data); // Stream audio data to Deepgram
        }
      };

      mediaRecorder.start(250); // Send audio chunks every 250ms
    };

    // Handle incoming messages from Deepgram
    deepgramSocket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      const newTranscript = data.channel.alternatives[0].transcript;
      setTranscript((prev) => prev + " " + newTranscript); // Append new words
    };

    deepgramSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      handleStopRecording(); // Stop recording on error
    };
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    recorderRef.current?.stop();
    audioRef.current?.getTracks().forEach((track) => track.stop());
    wsRef.current?.close();
  };

  useEffect(() => {
    // Cleanup on component unmount
    return () => {
      recorderRef.current?.stop();
      wsRef.current?.close();
      audioRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <Box mt={5} textAlign="center">
      <Typography variant="h4" gutterBottom>
        Real-time Speech-to-Text
      </Typography>

      <Button
        variant="contained"
        color={isRecording ? "secondary" : "primary"}
        onClick={isRecording ? handleStopRecording : handleStartRecording}
        sx={{ marginBottom: 2 }}
      >
        {isRecording ? "Stop Recording" : "Start Recording"}
      </Button>

      <Paper
        elevation={3}
        sx={{
          padding: 2,
          height: 200,
          overflowY: "auto",
          backgroundColor: "#f5f5f5",
          marginTop: 2,
        }}
      >
        <Typography variant="body1">
          {transcript || "Speak to see text..."}
        </Typography>
      </Paper>
    </Box>
  );
}
