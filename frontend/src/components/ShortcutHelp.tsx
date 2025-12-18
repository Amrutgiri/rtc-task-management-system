import { Modal, Table } from "react-bootstrap";
import { Keyboard } from "lucide-react";
import "../styles/shortcuts.css";

interface ShortcutHelpProps {
    show: boolean;
    onHide: () => void;
}

export default function ShortcutHelp({ show, onHide }: ShortcutHelpProps) {
    const shortcuts = [
        {
            category: "Navigation",
            items: [
                { keys: ["G", "D"], description: "Go to Dashboard" },
                { keys: ["G", "P"], description: "Go to Projects" },
                { keys: ["G", "T"], description: "Go to Tasks" },
                { keys: ["G", "K"], description: "Go to Kanban Board" },
                { keys: ["G", "N"], description: "Go to Notifications" },
            ],
        },
        {
            category: "Actions",
            items: [
                { keys: ["N"], description: "Create New Task" },
                { keys: ["Ctrl", "K"], description: "Quick Search" },
                { keys: ["Ctrl", "S"], description: "Save (in forms)" },
                { keys: ["?"], description: "Show Keyboard Shortcuts" },
            ],
        },
        {
            category: "General",
            items: [
                { keys: ["Esc"], description: "Close Modal/Dialog" },
                { keys: ["Ctrl", "/"], description: "Toggle Shortcuts Help" },
            ],
        },
    ];

    return (
        <Modal show={show} onHide={onHide} size="lg" centered className="shortcut-modal">
            <Modal.Header closeButton>
                <Modal.Title className="d-flex align-items-center gap-2">
                    <Keyboard size={24} />
                    Keyboard Shortcuts
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <p className="text-muted mb-4">
                    Use these keyboard shortcuts to navigate faster and boost your productivity.
                </p>

                {shortcuts.map((category, idx) => (
                    <div key={idx} className="mb-4">
                        <h6 className="text-uppercase text-muted mb-3" style={{ fontSize: "0.85rem" }}>
                            {category.category}
                        </h6>
                        <Table hover className="shortcut-table">
                            <tbody>
                                {category.items.map((item, itemIdx) => (
                                    <tr key={itemIdx}>
                                        <td className="shortcut-keys">
                                            {item.keys.map((key, keyIdx) => (
                                                <span key={keyIdx}>
                                                    <kbd className="shortcut-key">{key}</kbd>
                                                    {keyIdx < item.keys.length - 1 && (
                                                        <span className="mx-1 text-muted">+</span>
                                                    )}
                                                </span>
                                            ))}
                                        </td>
                                        <td className="shortcut-description">{item.description}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                ))}

                <div className="mt-4 p-3 bg-light rounded">
                    <small className="text-muted">
                        <strong>Tip:</strong> Press <kbd className="shortcut-key">?</kbd> anytime to view
                        this help dialog.
                    </small>
                </div>
            </Modal.Body>
        </Modal>
    );
}
