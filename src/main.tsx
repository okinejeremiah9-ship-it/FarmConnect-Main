import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { UserSessionProvider } from "./contexts/UserSessionContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <UserSessionProvider>
    <App />
  </UserSessionProvider>
);
