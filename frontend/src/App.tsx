import { useState, useEffect } from "react";
import AppRouter from "./router/AppRouter";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ThemeProvider } from "./context/ThemeContext";
import ShortcutHelp from "./components/ShortcutHelp";
import "./styles/dark-mode.css";
import "./styles/mobile-responsive.css";

function App() {
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Show shortcuts help with ? or Ctrl+/
      if (e.key === "?" || (e.ctrlKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcuts(true);
      }

      // Close shortcuts with Escape
      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <AppRouter />
          <ShortcutHelp show={showShortcuts} onHide={() => setShowShortcuts(false)} />
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
