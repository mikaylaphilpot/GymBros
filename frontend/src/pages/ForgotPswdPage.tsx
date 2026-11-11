import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import PageTitle from "../components/PageTitle";
import ParagraphText from "../components/ParagraphText";
import "../styles/homepage.css";
import { forgotPassword } from "../api/auth";

export default function ForgotPswdPage() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isSending, setIsSending] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setMessage("");
        setError("");
        setIsSending(true);

        try {
            const result = await forgotPassword(email.trim());
            setMessage(result);
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to send password reset email."
            );
        } finally {
            setIsSending(false);
        }
    }

    return (
        <main>
            <div className="container-wrapper">
                <div className="condensed-white-container">

                    <div className="header">
                        <PageTitle label="Forgot Password?" />
                    </div>

                    <ParagraphText text="Enter email below and we'll send you a password reset link." />

                    <form className="forget-password-box" onSubmit={handleSubmit}>
                        <label htmlFor="email">Email</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />

                        <div className="pswd-page-routing">
                            <button
                                type="submit"
                                className="normal-button"
                                disabled={isSending}
                            >
                                {isSending ? "Sending..." : "Send"}
                            </button>

                            <Link to="/">Back</Link>
                        </div>
                    </form>

                    {message && <p className="password-message" role="status">{message}</p>}
                    {error && <p className="error-message" role="alert">{error}</p>}

                </div>
            </div>
        </main>
    );
}
