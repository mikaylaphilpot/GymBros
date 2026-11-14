import { useEffect, useState } from "react";
import RoutingButton from "../components/RoutingButton";
import "../styles/homepage.css";

import backArrow from "../assets/backArrow.png";
import PageTitle from "../components/PageTitle";
import UserInfoProfileSection from "../components/UserInfoProfileSection";
import WorkoutScheduleProfileSection from "../components/WorkoutScheduleProfileSection";
import { getCurrentUser, type UserProfile } from "../api/auth";
import {
    subscribeToPushNotifications,
    hasPushSubscription
} from "../utils/pushNotifications";


//Displays user information and workout schedule, both can be edited by clicking the edit buttons
export default function ProfilePage() {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [error, setError] = useState("");

    const [notificationStatus, setNotificationStatus] = useState<
        "idle" | "loading" | "enabled"
    >("idle");

    const [notificationError, setNotificationError] = useState("");

    //Loads profile page when user first navigates to it
    useEffect(() => {
        async function loadProfile() {
            try {
                const userData = await getCurrentUser();
                setUser(userData);

                const isSubscribed = await hasPushSubscription();

                if (isSubscribed) {
                    setNotificationStatus("enabled");
                }
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

    //When Enable Notifications button is pressed, carries out the logic of the NotificationTestPage to enroll user in browser notifications
    async function handleEnableNotifications() {
        try {
            setNotificationError("");
            setNotificationStatus("loading");

            await subscribeToPushNotifications();

            setNotificationStatus("enabled");
        } catch (error) {
            setNotificationStatus("idle");
            setNotificationError(
                error instanceof Error
                    ? error.message
                    : "Unable to enable notifications."
            );
        }
    }

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
                    <div className="header profile-header">
                        <PageTitle label="Profile" />

                        {/* Button to enable notifications */}
                        <button
                            className="notification-button"
                            onClick={handleEnableNotifications}
                            disabled={
                                notificationStatus === "loading" ||
                                notificationStatus === "enabled"
                            }
                        >
                            {notificationStatus === "loading"
                                ? "Enabling..."
                                : notificationStatus === "enabled"
                                    ? "Notifications Enabled"
                                    : "Enable Notifications"}
                        </button>
                    </div>

                    {notificationError && (
                        <p className="error-message">{notificationError}</p>
                    )}
                    <hr className="line-divider" />
                </div>

                {error && <p className="error-message">{error}</p>}

                {!user && !error && <p className="message-text">Loading profile...</p>}

                {/* Main body of page with schedule and user information components pulling data from the DB */}
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

                {/* Signs user out of their profile */}
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
