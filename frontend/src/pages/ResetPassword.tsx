import { useState } from "react";
import { Container, Card, Form, Button, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "../schemas/authRules";
import { z } from "zod";
import api from "../api/axios";

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
    const navigate = useNavigate();
    const [success, setSuccess] = useState("");
    const [serverError, setServerError] = useState("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    async function onSubmit(data: ResetPasswordFormData) {
        setSuccess("");
        setServerError("");

        try {
            await api.post("/auth/reset-password", data);
            setSuccess("Password reset successful! Redirecting to login...");
            setTimeout(() => navigate("/login"), 2000);
        } catch (err: any) {
            setServerError(err.response?.data?.message || "Invalid or expired token");
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
                        <h3 className="fw-bold">Reset Password</h3>
                        <p className="text-muted small">Enter the token sent to your email</p>
                    </div>

                    {success && <Alert variant="success">{success}</Alert>}
                    {serverError && <Alert variant="danger">{serverError}</Alert>}

                    <Form onSubmit={handleSubmit(onSubmit)}>
                        <Form.Group className="mb-3">
                            <Form.Label>Reset Token</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Paste token here"
                                className={errors.token ? "is-invalid" : ""}
                                {...register("token")}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.token?.message}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>New Password</Form.Label>
                            <Form.Control
                                type="password"
                                placeholder="Enter new password (min 6 characters)"
                                autoComplete="new-password"
                                className={errors.newPassword ? "is-invalid" : ""}
                                {...register("newPassword")}
                            />
                            <Form.Control.Feedback type="invalid">
                                {errors.newPassword?.message}
                            </Form.Control.Feedback>
                        </Form.Group>

                        <Button type="submit" className="w-100 mb-3" variant="primary" disabled={isSubmitting}>
                            {isSubmitting ? "Resetting..." : "Reset Password"}
                        </Button>

                        <div className="text-center">
                            <Link to="/login" className="text-decoration-none">Back to Login</Link>
                        </div>
                    </Form>
                </Card>
            </Container>
        </div>
    );
}
