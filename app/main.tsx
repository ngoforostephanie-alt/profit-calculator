import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "../styles/index.css";
import "../styles/globals.css";
import "../styles/theme.css";
import "../styles/tailwind.css";
import "../styles/fonts.css";
import "../default_shadcn_theme.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);