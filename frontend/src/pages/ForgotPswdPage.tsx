import { Link } from "react-router";
import PageTitle from "../components/PageTitle";
import ParagraphText from "../components/ParagraphText";
import RoutingButton from "../components/RoutingButton";
import '../styles/homepage.css';

export default function ForgotPswdPage() {
    return (
        <div className="container-wrapper">
            <div className="condensed-white-container">

                <div className="header">
                    <PageTitle label="Forgot Password?" />
                </div>

                <ParagraphText text="Enter email below and we'll send you a password reset link." />

                <div className="forget-password-box">
                    <label htmlFor="email">Email</label>
                    <input type="email" id="email" name="email" />
                </div>

                <div className="pswd-page-routing">
                    <RoutingButton label="Send" routingTo="" iconSrc="" normalButton={1} />
                    <Link to="/home-page">Back</Link>
                </div>

                


            </div>
        </div>

    );
}