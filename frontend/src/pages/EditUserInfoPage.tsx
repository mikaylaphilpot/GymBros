import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import RoutingButton from "../components/RoutingButton";
import "../styles/homepage.css";

import cancelIcon from "../assets/cancelIcon.png";
import PageTitle from "../components/PageTitle";
import EditUserInfo from "../components/EditUserInfo";
import {
    getCurrentUser,
    updateCurrentUser,
    type UserProfile
} from "../api/auth";

type EditableField =
    | "name"
    | "username"
    | "currentPassword"
    | "newPassword";


export default function EditUserInfoPage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [name, setName] = useState("");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const navigate = useNavigate();

    //Load the current user's information when the page opens
    useEffect(() => {
        async function loadProfile() {
            try {
                const userData = await getCurrentUser();

                setUser(userData);
                setName(userData.name);
                setUsername(userData.username);
                setEmail(userData.email);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load profile."
                );
            } finally {
                setLoading(false);
            }
        }

        loadProfile();
    }, []);

    //Updates input boxes as user types in their data
    function handleChange(inputName: EditableField, value: string) {
        switch (inputName) {
            case "name":
                setName(value);
                break;

            case "username":
                setUsername(value);
                break;

            case "currentPassword":
                setCurrentPassword(value);
                break;

            case "newPassword":
                setNewPassword(value);
                break;
        }
    }

    async function handleSave() {
        setError("");
        setMessage("");

        if (!name.trim() || !username.trim()) {
            setError("Name and username cannot be empty.");
            return;
        }

        if (!currentPassword) {
            setError("Please enter your current password to save changes.");
            return;
        }

        try {
            setSaving(true);

            const result = await updateCurrentUser(
                name.trim(),
                username.trim(),
                currentPassword,
                newPassword || undefined
            );

            setMessage(result);

            //Return to the profile page after a successful update
            navigate("/profile-page");

        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to update profile."
            );
        } finally {
            setSaving(false);
        }
    }

    return (
        <main>
            <div className="white-container">

                <div className="left-align-button">
                    <RoutingButton
                        label="Cancel"
                        routingTo="/profile-page"
                        iconSrc={cancelIcon}
                        height={30}
                        width={30}
                    />
                </div>

                <div className="no-gap-group-vertical">
                    <div className="header">
                        <PageTitle label="Edit User Information" />
                    </div>
                    <hr className="line-divider" />
                </div>

                {loading && <p className="message-text">Loading profile...</p>}

                {/* Pulls user info from DB and loads it onto screen for editing */}
                {!loading && user && (
                    <>
                        <EditUserInfo
                            name={name}
                            username={username}
                            email={email}
                            currentPassword={currentPassword}
                            newPassword={newPassword}
                            onChange={handleChange}
                        />

                        {error && (
                            <p className="error-message">{error}</p>
                        )}

                        {message && (
                            <p className="password-message">{message}</p>
                        )}

                        <RoutingButton
                            label={saving ? "Saving..." : "Save"}
                            routingTo=""
                            iconSrc=""
                            normalButton={1}
                            onClick={handleSave}
                        />
                    </>
                )}

                {!loading && !user && error && (
                    <p className="error-message">{error}</p>
                )}

            </div>
        </main>
    );
}
