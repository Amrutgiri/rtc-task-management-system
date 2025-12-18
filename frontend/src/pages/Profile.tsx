import { useState, useEffect } from "react";
import { Container, Row, Col, Card, Form, Button, Tab, Nav } from "react-bootstrap";
import MainLayout from "../layout/MainLayout";
import api from "../api/axios";
import Swal from "sweetalert2";
import { User, Lock, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileSchema, changePasswordSchema } from "../schemas/authRules";
import { z } from "zod";

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof changePasswordSchema>;

export default function Profile() {
    const [user, setUser] = useState<{ name: string; email: string; avatar?: string } | null>(null);
    const [loading, setLoading] = useState(true);

    const {
        register: registerProfile,
        handleSubmit: handleSubmitProfile,
        formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
        setValue: setProfileValue,
    } = useForm<ProfileFormData>({
        resolver: zodResolver(profileSchema),
    });

    const {
        register: registerPassword,
        handleSubmit: handleSubmitPassword,
        formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
        reset: resetPasswordForm,
    } = useForm<PasswordFormData>({
        resolver: zodResolver(changePasswordSchema),
    });

    useEffect(() => {
        fetchProfile();
    }, []);

    async function fetchProfile() {
        try {
            const res = await api.get("/users/profile");
            setUser(res.data);
            setProfileValue("name", res.data.name);
        } catch (error) {
            console.error("Failed to load profile", error);
        } finally {
            setLoading(false);
        }
    }

    async function onProfileSubmit(data: ProfileFormData) {
        try {
            const res = await api.patch("/users/profile", data);
            setUser(res.data);
            Swal.fire("Success", "Profile updated successfully", "success");
        } catch (error: any) {
            Swal.fire("Error", error.response?.data?.message || "Failed to update profile", "error");
        }
    }

    async function onPasswordSubmit(data: PasswordFormData) {
        try {
            await api.patch("/users/change-password", {
                oldPassword: data.oldPassword,
                newPassword: data.newPassword
            });
            Swal.fire("Success", "Password changed successfully", "success");
            resetPasswordForm();
        } catch (error: any) {
            Swal.fire("Error", error.response?.data?.message || "Failed to change password", "error");
        }
    }

    return (
        <MainLayout>
            <Container className="py-4">
                <h2 className="mb-4 fw-bold">My Profile</h2>

                <Row>
                    <Col md={4} className="mb-4">
                        <Card className="shadow-sm text-center p-4">
                            <div
                                className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center mx-auto mb-3"
                                style={{ width: "100px", height: "100px", fontSize: "40px" }}
                            >
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <h4>{user?.name}</h4>
                            <p className="text-muted">{user?.email}</p>
                        </Card>
                    </Col>

                    <Col md={8}>
                        <Card className="shadow-sm">
                            <Card.Body>
                                <Tab.Container defaultActiveKey="details">
                                    <Nav variant="tabs" className="mb-4">
                                        <Nav.Item>
                                            <Nav.Link eventKey="details" className="d-flex align-items-center gap-2">
                                                <User size={18} /> Profile Details
                                            </Nav.Link>
                                        </Nav.Item>
                                        <Nav.Item>
                                            <Nav.Link eventKey="security" className="d-flex align-items-center gap-2">
                                                <Lock size={18} /> Security
                                            </Nav.Link>
                                        </Nav.Item>
                                    </Nav>

                                    <Tab.Content>
                                        <Tab.Pane eventKey="details">
                                            <Form onSubmit={handleSubmitProfile(onProfileSubmit)}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Full Name</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        className={profileErrors.name ? "is-invalid" : ""}
                                                        {...registerProfile("name")}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {profileErrors.name?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label>Email Address</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        value={user?.email || ""}
                                                        disabled
                                                    />
                                                    <Form.Text className="text-muted">
                                                        Email cannot be changed. Contact admin for assistance.
                                                    </Form.Text>
                                                </Form.Group>

                                                <Button type="submit" variant="primary" disabled={isProfileSubmitting}>
                                                    <Save size={18} className="me-2" />
                                                    {isProfileSubmitting ? "Saving..." : "Save Changes"}
                                                </Button>
                                            </Form>
                                        </Tab.Pane>

                                        <Tab.Pane eventKey="security">
                                            <Form onSubmit={handleSubmitPassword(onPasswordSubmit)}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Current Password</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        className={passwordErrors.oldPassword ? "is-invalid" : ""}
                                                        {...registerPassword("oldPassword")}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {passwordErrors.oldPassword?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>
                                                <hr />
                                                <Form.Group className="mb-3">
                                                    <Form.Label>New Password</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        className={passwordErrors.newPassword ? "is-invalid" : ""}
                                                        {...registerPassword("newPassword")}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {passwordErrors.newPassword?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>

                                                <Form.Group className="mb-3">
                                                    <Form.Label>Confirm New Password</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        className={passwordErrors.confirmPassword ? "is-invalid" : ""}
                                                        {...registerPassword("confirmPassword")}
                                                    />
                                                    <Form.Control.Feedback type="invalid">
                                                        {passwordErrors.confirmPassword?.message}
                                                    </Form.Control.Feedback>
                                                </Form.Group>

                                                <Button type="submit" variant="danger" disabled={isPasswordSubmitting}>
                                                    {isPasswordSubmitting ? "Updating..." : "Update Password"}
                                                </Button>
                                            </Form>
                                        </Tab.Pane>
                                    </Tab.Content>
                                </Tab.Container>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </MainLayout>
    );
}
