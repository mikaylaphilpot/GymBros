import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router";
import PageTitle from "../components/PageTitle";
import ParagraphText from "../components/ParagraphText";
import "../styles/homepage.css";

export default function VerifyEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [isVerifying, setIsVerifying] = useState(true);

    useEffect(() => {
        async function verifyEmail() {
            setMessage("");
            setError("");
            setIsVerifying(true);

            if (!token) {
                setError("This verification link is invalid or missing its token.");
                setIsVerifying(false);
                return;
            }

            try {
                const response = await fetch(
                    `/api/auth/verify-email?token=${encodeURIComponent(token)}`
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Email verification failed.");
                }

                setMessage(data.message || "Your email has been successfully verified! Please log in to your account.");
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to verify your email."
                );
            } finally {
                setIsVerifying(false);
            }
        }

        verifyEmail();
    }, [token]);

    return (
        <main>
            <div className="container-wrapper">
                <div className="condensed-white-container">

                    <div className="header">
                        <PageTitle label="Verify Email" />
                    </div>

                    <div className="verify-email-container">

                        {isVerifying && (
                            <ParagraphText text="Verifying your email..." />
                        )}

                        {!isVerifying && message && (
                            <div className="verification-success" role="status">
                                <ParagraphText text={message} />
                            </div>
                        )}

                        {!isVerifying && error && (
                            <div className="error-message" role="alert">
                                <ParagraphText text={error} />
                            </div>
                        )}

                        {!isVerifying && (
                            <div className="pswd-page-routing">
                                <Link to="/">Back to Login</Link>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </main>
    );
}
