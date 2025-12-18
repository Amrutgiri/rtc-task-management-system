import { Moon, Sun } from "lucide-react";
import { useTheme } from "../context/ThemeContext";
import "../styles/theme-toggle.css";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
            <div className="theme-toggle-icon">
                {theme === "light" ? (
                    <Moon size={20} className="icon-moon" />
                ) : (
                    <Sun size={20} className="icon-sun" />
                )}
            </div>
        </button>
    );
}
