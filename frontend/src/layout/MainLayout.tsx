import { Container, Row, Col } from "react-bootstrap";
import Sidebar from "../components/Sidebar";
import NavbarTop from "../components/Navbar";


import { useState } from "react";

export default function MainLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="d-flex">
      {/* Sidebar - Mobile Responsive */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-grow-1" style={{ minWidth: 0 }}> {/* minWidth:0 prevents flex items from overflowing */}
        <NavbarTop onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <Container fluid className="mt-4 pb-5"> {/* Added padding bottom for mobile scroll */}
          {children}
        </Container>
      </div>
    </div>
  );
}
