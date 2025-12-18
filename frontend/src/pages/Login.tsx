import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
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
import { loginSchema } from "../schemas/authRules";
import { z } from "zod";
import AnimatedBackground from "../components/AnimatedBackground";

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useContext(AuthContext) as any;
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  async function onSubmit(data: LoginFormData) {
    setServerError("");
    try {
      const user = await login(data.email, data.password);
      if (user?.role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      setServerError(err.response?.data?.message || "Invalid email or password");
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
                    className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary bg-opacity-10"
                    style={{ width: "80px", height: "80px" }}
                  >
                    <i className="bi bi-lock-fill text-primary" style={{ fontSize: "40px" }}></i>
                  </div>
                </div>
                <h2 className="fw-bold mb-2">Welcome Back</h2>
                <p className="text-muted">Login to continue accessing your workspace</p>
              </div>

              {serverError && <Alert variant="danger">{serverError}</Alert>}

              <Form onSubmit={handleSubmit(onSubmit)}>
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
                      placeholder="Enter password"
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

                  <div className="text-end mt-1">
                    <Link to="/forgot-password" style={{ fontSize: "0.85rem", textDecoration: "none" }}>Forgot Password?</Link>
                  </div>
                </Form.Group>

                <Button
                  type="submit"
                  className="w-100 rounded-pill mt-2 py-3 fw-semibold"
                  style={{ fontSize: "16px" }}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : "Login"}
                </Button>
              </Form>

              <div className="text-center mt-4">
                <small className="text-muted">
                  Don't have an account?{" "}
                  <Link to="/register" className="fw-bold text-decoration-none">
                    Register here
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
