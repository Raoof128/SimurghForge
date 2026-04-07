import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { strings } from "./i18n/strings";
import "./index.css";

document.title = strings.appTitle;
const metaDesc = document.querySelector('meta[name="description"]');
if (metaDesc) {
  metaDesc.setAttribute("content", strings.metaAppDescription);
}

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("Root element #root not found");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
