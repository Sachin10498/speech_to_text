"use client";

import { Container, CssBaseline } from "@mui/material";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Speech-to-Text App</title>
      </head>
      <body>
        <CssBaseline />
        <Container maxWidth="md">{children}</Container>
      </body>
    </html>
  );
}
