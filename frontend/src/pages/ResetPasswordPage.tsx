import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import PageTitle from "../components/PageTitle";
import "../styles/homepage.css";
import { resetPassword } from "../api/auth";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setMessage("");
        setError("");

        if (!token) {
            setError("This password reset link is invalid or missing its token.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Your passwords do not match.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await resetPassword(token, password);
            setMessage(result);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to reset your password."
            );
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <main>
            <div className="container-wrapper">
                <div className="condensed-white-container">
                    <div className="header">
                        <PageTitle label="Reset Password" />
                    </div>

                    <p>Enter and confirm your new password below.</p>

                    <form className="forget-password-box" onSubmit={handleSubmit}>
                        <label htmlFor="password">New Password</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            required
                        />

                        <label htmlFor="confirmPassword">Confirm Password</label>
                        <input
                            type="password"
                            id="confirmPassword"
                            value={confirmPassword}
                            onChange={(event) => setConfirmPassword(event.target.value)}
                            required
                        />

                        <div className="pswd-page-routing">
                            <button
                                type="submit"
                                className="normal-button"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Resetting..." : "Submit"}
                            </button>

                            <Link to="/">Back to Login</Link>
                        </div>
                    </form>

                    {message && <p className="password-message" role="status">{message}</p>}
                    {error && <p className="error-message" role="alert">{error}</p>}
                </div>
            </div>
        </main>
    );
}
