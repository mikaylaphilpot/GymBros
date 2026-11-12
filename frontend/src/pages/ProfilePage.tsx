import { useEffect, useState } from "react";
import RoutingButton from "../components/RoutingButton";
import "../styles/homepage.css";

import backArrow from "../assets/backArrow.png";
import PageTitle from "../components/PageTitle";
import UserInfoProfileSection from "../components/UserInfoProfileSection";
import WorkoutScheduleProfileSection from "../components/WorkoutScheduleProfileSection";
import { getCurrentUser, type UserProfile } from "../api/auth";

export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadProfile() {
            try {
                const userData = await getCurrentUser();
                setUser(userData);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load profile."
                );
            }
        }

        loadProfile();
    }, []);

    return (
        <main>
            <div className="white-container">
                <div className="left-align-button">
                    <RoutingButton
                        label="Back"
                        routingTo="/home-page"
                        iconSrc={backArrow}
                        height={30}
                        width={30}
                    />
                </div>

                <div className="no-gap-group-vertical">
                    <div className="header">
                        <PageTitle label="Profile" />
                    </div>
                    <hr className="line-divider" />
                </div>

                {error && <p className="error-message">{error}</p>}

                {!user && !error && <p>Loading profile...</p>}

                {user && (
                    <>
                        <WorkoutScheduleProfileSection title="Workout Schedule" />

                        <UserInfoProfileSection
                            title="User Information"
                            name={user.name}
                            username={user.username}
                            email={user.email}
                        />
                    </>
                )}

                <RoutingButton
                    label="Sign Out"
                    routingTo="/"
                    iconSrc=""
                    normalButton={1}
                />
            </div>
        </main>
    );
}
