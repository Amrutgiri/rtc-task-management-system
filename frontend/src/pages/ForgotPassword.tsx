import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "../schemas/authRules";
import { z } from "zod";
import api from "../api/axios";

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
    const [message, setMessage] = useState("");
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    async function onSubmit(data: ForgotPasswordFormData) {
        setMessage("");
        setServerError("");

        try {
            await api.post("/auth/forgot-password", data);
            setMessage("If an account exists, a reset instruction has been sent (Check server console).");
        } catch (err: any) {
            setServerError("Something went wrong");
        }
    }

    return (
        <div style={{
            background: "linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)",
            minHeight: "100vh",
            display: "flex",
            alignItems: "center"
        }}>
            <Container style={{ maxWidth: "400px" }}>
                <Card className="p-4 shadow-lg border-0 rounded-4">
                    <div className="text-center mb-4">
                        <h3 className="fw-bold">Forgot Password</h3>
                        <p className="text-muted small">Enter your email to reset your password</p>
                    </div>

                    {message && <Alert variant="success">{message}</Alert>}
                    {serverError && <Alert variant="danger">{serverError}</Alert>}

                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email Address</Form.Label>
                            <Form.Control
                                type="email"
                                placeholder="Enter your email"
                                className={errors.email ? "is-invalid" : ""}
                                {...register("email")}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.email?.message}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Button type="submit" className="w-100 mb-3" variant="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Sending..." : "Send Reset Link"}
                        </Button>

                        <div className="text-center">
                            <Link to="/login" className="text-decoration-none">Back to Login</Link>
                            <span className="mx-2">|</span>
                            <Link to="/reset-password" className="text-decoration-none">Have a Token?</Link>
                        </div>
                    </Form>
                </Card>
            </Container>
        </div>
    );
}
