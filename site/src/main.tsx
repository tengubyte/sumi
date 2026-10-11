import "@fontsource/zen-kaku-gothic-new/latin-400.css";
import "@fontsource/zen-kaku-gothic-new/latin-700.css";
import "@fontsource/zen-kaku-gothic-new/latin-900.css";
import "./styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
