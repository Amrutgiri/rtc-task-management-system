import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  InputGroup,
  Alert,
} from "react-bootstrap";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "../schemas/authRules";
import { z } from "zod";
import api from "../api/axios";
import AnimatedBackground from "../components/AnimatedBackground";

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  async function onSubmit(data: RegisterFormData) {
    setServerError("");
    setSuccess("");

    try {
      await api.post("/auth/register", data);
      setSuccess("Registration successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Registration failed");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", position: "relative" }}>
      <AnimatedBackground />

      <Container style={{ position: "relative", zIndex: 1 }}>
        <Row className="justify-content-center">
          <Col md={5}>
            <Card className="p-4 shadow-lg auth-card" style={{ borderRadius: "20px" }}>
              <div className="text-center mb-4">
                <div className="mb-3">
                  <div
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-success bg-opacity-10"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <i className="bi bi-person-plus-fill text-success" style={{ fontSize: "40px" }}></i>
                  </div>
                </div>
                <h2 className="fw-bold mb-2">Create an Account</h2>
                <p className="text-muted">Register to start managing your tasks</p>
              </div>

              {serverError && <Alert variant="danger">{serverError}</Alert>}
              {success && <Alert variant="success">{success}</Alert>}

              <Form onSubmit={handleSubmit(onSubmit)}>
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter full name"
                    className={`rounded-pill ${errors.name ? "is-invalid" : ""}`}
                    {...register("name")}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.name?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter email"
                    className={`rounded-pill ${errors.email ? "is-invalid" : ""}`}
                    {...register("email")}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <InputGroup className={`${errors.password ? "is-invalid" : ""}`}>
                    <Form.Control
                      type={showPass ? "text" : "password"}
                      placeholder="Enter password (min 6 characters)"
                      className={`rounded-start-pill ${errors.password ? "is-invalid" : ""}`}
                      {...register("password")}
                    />
                    <Button
                      variant="outline-secondary"
                      className="rounded-end-pill"
                      onClick={() => setShowPass(!showPass)}
                    >
                      {showPass ? "Hide" : "Show"}
                    </Button>
                  </InputGroup>
                  <Form.Control.Feedback type="invalid" className="d-block">
                    {errors.password?.message}
                  </Form.Control.Feedback>
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100 rounded-pill mt-2 py-3 fw-semibold"
                  variant="success"
                  style={{ fontSize: "16px" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Creating account...
                    </>
                  ) : "Register"}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <small className="text-muted">
                  Already have an account?{" "}
                  <Link to="/login" className="fw-bold text-decoration-none">
                    Login here
                  </Link>
                </small>
              </div>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

