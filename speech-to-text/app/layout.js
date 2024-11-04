"use client";

import { Container, CssBaseline } from "@mui/material";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <title>Speech-to-Text</title>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <CssBaseline />
        <Container maxWidth="100%">{children}</Container>
      </body>
    </html>
  );
}
