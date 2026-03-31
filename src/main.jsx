import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { DeviceProvider } from "./context/DeviceContext.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <DeviceProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <App />
      </BrowserRouter>
    </DeviceProvider>
  </StrictMode>
);
