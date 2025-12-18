import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Container, Card, Alert, Spinner } from "react-bootstrap";
import api from "../api/axios";
import AnimatedBackground from "../components/AnimatedBackground";

export default function VerifyEmail() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [message, setMessage] = useState("");

    useEffect(() => {
        verifyEmail();
    }, [token]);

    async function verifyEmail() {
        try {
            const res = await api.get(`/auth/verify-email/${token}`);
            setStatus("success");
            setMessage(res.data.message || "Email verified successfully!");

            // Redirect to login after 3 seconds
            setTimeout(() => {
                navigate("/login");
            }, 3000);
        } catch (err: any) {
            setStatus("error");
            setMessage(err.response?.data?.message || "Verification failed. The link may have expired.");
        }
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative" }}>
            <AnimatedBackground />

            <Container style={{ position: "relative", zIndex: 1, maxWidth: "500px" }}>
                <Card className="p-4 shadow-lg auth-card" style={{ borderRadius: "20px" }}>
                    <div className="text-center mb-4">
                        <div className="mb-3">
                            <div
                                className={`d-inline-flex align-items-center justify-content-center rounded-circle ${status === "loading" ? "bg-primary" : status === "success" ? "bg-success" : "bg-danger"
                                    } bg-opacity-10`}
                                style={{ width: "80px", height: "80px" }}
                            >
                                {status === "loading" && <Spinner animation="border" variant="primary" />}
                                {status === "success" && <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "40px" }}></i>}
                                {status === "error" && <i className="bi bi-x-circle-fill text-danger" style={{ fontSize: "40px" }}></i>}
                            </div>
                        </div>
                        <h2 className="fw-bold mb-2">
                            {status === "loading" && "Verifying Email..."}
                            {status === "success" && "Email Verified!"}
                            {status === "error" && "Verification Failed"}
                        </h2>
                    </div>

                    {status === "loading" && (
                        <p className="text-center text-muted">
                            Please wait while we verify your email address...
                        </p>
                    )}

                    {status === "success" && (
                        <>
                            <Alert variant="success" className="mb-3">
                                {message}
                            </Alert>
                            <p className="text-center text-muted small">
                                Redirecting to login page in 3 seconds...
                            </p>
                            <div className="text-center mt-3">
                                <Link to="/login" className="btn btn-success btn-sm">
                                    Login Now
                                </Link>
                            </div>
                        </>
                    )}

                    {status === "error" && (
                        <>
                            <Alert variant="danger" className="mb-3">
                                {message}
                            </Alert>
                            <div className="text-center mt-3">
                                <Link to="/login" className="btn btn-primary btn-sm me-2">
                                    Go to Login
                                </Link>
                                <Link to="/register" className="btn btn-outline-secondary btn-sm">
                                    Register Again
                                </Link>
                            </div>
                        </>
                    )}
                </Card>
            </Container>
        </div>
    );
}
