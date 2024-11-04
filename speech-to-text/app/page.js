"use client";

import { useState, useRef, useEffect } from "react";
import {
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  Divider,
} from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import StopIcon from "@mui/icons-material/Stop";
import PauseIcon from "@mui/icons-material/Pause";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AudiotrackIcon from "@mui/icons-material/Audiotrack";

export default function HomePage() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [language, setLanguage] = useState("");
  const [instructionText, setInstructionText] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [audioURL, setAudioURL] = useState(null); // New: Store audio URL for playback

  const audioRef = useRef(null);
  const wsRef = useRef(null);
  const recorderRef = useRef(null);
  const audioChunksRef = useRef([]); // New: Store audio chunks

  const DEEPGRAM_API_KEY = process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY;

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleCopyTranscript = () => {
    navigator.clipboard.writeText(transcript).then(() => {
      setCopySuccess(true);
    });
  };

  const handleStartRecording = async () => {
    setTranscript("");
    setIsRecording(true);
    setIsPaused(false);
    setInstructionText("Wait for a few seconds...");
    audioChunksRef.current = []; // Reset audio chunks

    const queryParam =
      language === "hinglish" ? "languages=hi,en" : `language=${language}`;

    const deepgramSocket = new WebSocket(
      `wss://api.deepgram.com/v1/listen?punctuate=true&${queryParam}`,
      ["token", DEEPGRAM_API_KEY]
    );

    wsRef.current = deepgramSocket;

    deepgramSocket.onopen = async () => {
      console.log("WebSocket connection established");

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      recorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (deepgramSocket.readyState === WebSocket.OPEN) {
          deepgramSocket.send(event.data);
        }
        audioChunksRef.current.push(event.data); // Store audio chunks
      };

      mediaRecorder.start(250);

      setTimeout(() => {
        setInstructionText("Now start speaking...");
      }, 2000);
    };

    deepgramSocket.onmessage = (message) => {
      const data = JSON.parse(message.data);
      const newTranscript = data.channel.alternatives[0].transcript;
      setTranscript((prev) => prev + " " + newTranscript);
    };

    deepgramSocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      handleStopRecording();
    };
  };

  const handlePauseRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.pause();
      setIsPaused(true);
    }
  };

  const handleResumeRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.resume();
      setIsPaused(false);
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    recorderRef.current?.stop();
    audioRef.current?.getTracks().forEach((track) => track.stop());
    wsRef.current?.close();
    setInstructionText("");

    // Create a Blob from audio chunks and generate a URL
    const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
    const url = URL.createObjectURL(audioBlob);
    setAudioURL(url); // Set audio URL for playback
  };

  useEffect(() => {
    return () => {
      recorderRef.current?.stop();
      wsRef.current?.close();
      audioRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const languages = [
    { code: "hi", name: "Hindi" },
    { code: "en", name: "English" },
    { code: "es", name: "Spanish" },
    { code: "fr", name: "French" },
    { code: "de", name: "German" },
    { code: "it", name: "Italian" },
    { code: "pt", name: "Portuguese" },
    { code: "ja", name: "Japanese" },
    { code: "ko", name: "Korean" },
    { code: "zh", name: "Chinese (Mandarin)" },
  ];

  return (
    <Box
      sx={{
        mt: 2,
        textAlign: "center",
        bgcolor: "#f5f5f5",
        minHeight: "100vh",
        padding: 4,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          bgcolor: "#e3f2fd",
          minHeight: "100vh",
          padding: 4,
          borderRadius: 2,
          boxShadow: 4,
          width: "80%",
        }}
      >
        <Typography
          variant="h4"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#4A4A4A" }}
        >
          Speech-to-Text
        </Typography>

        <Typography variant="body1" sx={{ color: "#555", marginBottom: 2 }}>
          {instructionText}
        </Typography>

        <FormControl sx={{ marginBottom: 3, minWidth: 200 }}>
          <InputLabel id="language-select-label"></InputLabel>
          <Select
            labelId="language-select-label"
            value={language}
            onChange={handleLanguageChange}
            displayEmpty
            sx={{
              bgcolor: "#ffffff",
              borderRadius: 2,
            }}
          >
            <MenuItem disabled value="">
              <em>Select a Language</em>
            </MenuItem>
            {languages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                {lang.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Stack
          direction="row"
          spacing={2}
          justifyContent="center"
          sx={{ marginBottom: 3 }}
        >
          {!isRecording && (
            <IconButton
              onClick={handleStartRecording}
              sx={{ bgcolor: "#4A90E2", color: "#fff" }}
            >
              <MicIcon />
            </IconButton>
          )}
          {isRecording && !isPaused && (
            <IconButton
              onClick={handlePauseRecording}
              sx={{ bgcolor: "#ff9800", color: "#fff" }}
            >
              <PauseIcon />
            </IconButton>
          )}
          {isPaused && (
            <IconButton
              onClick={handleResumeRecording}
              sx={{ bgcolor: "#4caf50", color: "#fff" }}
            >
              <PlayArrowIcon />
            </IconButton>
          )}
          {isRecording && (
            <IconButton
              onClick={handleStopRecording}
              sx={{ bgcolor: "#f44336", color: "#fff" }}
            >
              <StopIcon />
            </IconButton>
          )}
        </Stack>

        <Divider sx={{ marginBottom: 3 }} />

        <Card sx={{ marginTop: 2, borderRadius: 2, boxShadow: 3 }}>
          <CardContent>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ fontWeight: "bold", color: "#4A4A4A" }}
            >
              Transcription
            </Typography>
            <Typography variant="body1" sx={{ color: "#555" }}>
              {transcript || "Speak to see text..."}
            </Typography>
          </CardContent>
        </Card>

        {audioURL && (
          <audio controls src={audioURL} style={{ marginTop: 20 }} />
        )}
      </Box>
    </Box>
  );
}
