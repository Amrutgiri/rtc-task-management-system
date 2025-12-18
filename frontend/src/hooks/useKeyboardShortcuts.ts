import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface ShortcutConfig {
    key: string;
    ctrlKey?: boolean;
    shiftKey?: boolean;
    altKey?: boolean;
    description: string;
    action: () => void;
    category: string;
}

export function useKeyboardShortcuts(
    shortcuts: ShortcutConfig[],
    enabled: boolean = true
) {
    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (event: KeyboardEvent) => {
            // Don't trigger shortcuts when typing in inputs
            const target = event.target as HTMLElement;
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                // Allow Escape and Ctrl+S even in inputs
                if (event.key !== "Escape" && !(event.ctrlKey && event.key === "s")) {
                    return;
                }
            }

            for (const shortcut of shortcuts) {
                const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
                const ctrlMatch = shortcut.ctrlKey ? event.ctrlKey : !event.ctrlKey;
                const shiftMatch = shortcut.shiftKey ? event.shiftKey : !event.shiftKey;
                const altMatch = shortcut.altKey ? event.altKey : !event.altKey;

                if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
                    event.preventDefault();
                    shortcut.action();
                    break;
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [shortcuts, enabled]);
}

// Global shortcuts hook for app-wide navigation
export function useGlobalShortcuts() {
    const navigate = useNavigate();

    const shortcuts: ShortcutConfig[] = [
        {
            key: "d",
            description: "Go to Dashboard",
            category: "Navigation",
            action: () => navigate("/dashboard"),
        },
        {
            key: "p",
            description: "Go to Projects",
            category: "Navigation",
            action: () => navigate("/projects"),
        },
        {
            key: "t",
            description: "Go to Tasks",
            category: "Navigation",
            action: () => navigate("/tasks"),
        },
        {
            key: "k",
            description: "Go to Kanban Board",
            category: "Navigation",
            action: () => navigate("/kanban"),
        },
        {
            key: "n",
            description: "Go to Notifications",
            category: "Navigation",
            action: () => navigate("/notifications"),
        },
    ];

    useKeyboardShortcuts(shortcuts, true);
}

// Helper to format shortcut display
export function formatShortcut(shortcut: ShortcutConfig): string {
    const parts: string[] = [];
    if (shortcut.ctrlKey) parts.push("Ctrl");
    if (shortcut.shiftKey) parts.push("Shift");
    if (shortcut.altKey) parts.push("Alt");
    parts.push(shortcut.key.toUpperCase());
    return parts.join(" + ");
}
