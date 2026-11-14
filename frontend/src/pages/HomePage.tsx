import { useEffect, useState } from "react";

import PageTitle from "../components/PageTitle";
import ParagraphText from "../components/ParagraphText";
import BroWorkoutWidget from "../components/BroWorkoutWidget";
import RoutingButton from "../components/RoutingButton";
import "../styles/homepage.css";

import bugIcon from "../assets/bugIcon.png";
import congratsIcon from "../assets/congratsIcon.png";
import brosIcon from "../assets/brosIcon.png";
import profileIcon from "../assets/profileIcon.png";
import UserWorkoutWidget from "../components/UserWorkoutWidget";


//Importing API helpers for page functionality
import {
    getTodaysSchedule,
    updateWorkoutCompletion,
    type ScheduleEntry
} from "../api/schedule";

import {
    getCurrentUserId,
    getFriendsTodayWorkouts,
    sendFriendNotification,
    type FriendWorkout
} from "../api/friends";

//Pulls isCompletedToday data from bro and determines what color widget should be
function getBroWorkoutStatus(
    workout: FriendWorkout["workouts"][number]
): "completed" | "overdue" | "default" {

    if (workout.isCompletedToday) {
        return "completed";
    }

    const match = workout.endTime.trim().match(
        /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (!match) {
        return "default";
    }

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const period = match[3].toUpperCase();

    if (period === "PM" && hours !== 12) hours += 12;
    if (period === "AM" && hours === 12) hours = 0;

    const workoutEndMinutes = hours * 60 + minutes;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return currentMinutes >= workoutEndMinutes ? "overdue" : "default";
}


export default function HomePage() {
    const [schedule, setSchedule] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [friends, setFriends] = useState<FriendWorkout[]>([]);
    const [friendsLoading, setFriendsLoading] = useState(true);
    const [friendsError, setFriendsError] = useState("");

    const [sendingFriendAction, setSendingFriendAction] = useState("");
    const [friendActionError, setFriendActionError] = useState("");
    const [friendActionSuccess, setFriendActionSuccess] = useState("");

    //Loads user's personal schedule when user navigates to page
    useEffect(() => {
        async function loadSchedule() {
            try {
                const todaysSchedule = await getTodaysSchedule();
                setSchedule(todaysSchedule);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load your workouts."
                );
            } finally {
                setLoading(false);
            }
        }

        loadSchedule();
    }, []);

    //Pulls user ID to determine which bro workouts to display on home page, color is determined by completion status
    useEffect(() => {
        async function loadFriendsWorkouts() {
            try {
                const currentUserId = await getCurrentUserId();

                const friendsWorkouts = await getFriendsTodayWorkouts(
                    currentUserId
                );

                setFriends(friendsWorkouts);
            } catch (error) {
                setFriendsError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load your friends' workouts."
                );
            } finally {
                setFriendsLoading(false);
            }
        }

        loadFriendsWorkouts();
    }, []);

    const activeWorkouts = schedule.filter(
        (workout) => !workout.isCompletedToday
    );

    const completedWorkouts = schedule.filter(
        (workout) => workout.isCompletedToday
    );

    //Updates home page and backend when user completes a workout
    async function handleWorkoutCompletion(
        workoutId: string,
        checked: boolean
    ) {
        try {
            //Save the change to the backend first
            const updatedWorkout = await updateWorkoutCompletion(
                workoutId,
                checked
            );

            //Update the displayed schedule using the backend response
            setSchedule((previousSchedule) =>
                previousSchedule.map((workout) =>
                    workout._id === workoutId ? updatedWorkout : workout
                )
            );
        } catch (error) {
            setError(
                error instanceof Error
                    ? error.message
                    : "Unable to update workout completion."
            );
        }
    }

    //When bug or congratulate button pressed, sends notification to the user's bro if their notifications are enabled
    async function handleFriendAction(
        friendId: string,
        workoutKey: string,
        action: "bug" | "congratulate"
    ) {
        setSendingFriendAction(workoutKey);
        setFriendActionError("");
        setFriendActionSuccess("");

        try {
            await sendFriendNotification(friendId, action);

            setFriendActionSuccess(
                action === "bug"
                    ? "Workout reminder sent!"
                    : "Congratulations sent!"
            );
        } catch (error) {
            setFriendActionError(
                error instanceof Error
                    ? error.message
                    : "Unable to send notification."
            );
        } finally {
            setSendingFriendAction("");
        }
    }


    return (
        <main>
            <div className="white-container">
                <div className="no-gap-group-vertical">
                    <div className="header">
                        <PageTitle label="Hey, Bro!" />
                        <div className="no-gap-group-horizontal">
                            {/* Navigation icons for Bros and Profile pages */}
                            <RoutingButton
                                label="Bros"
                                routingTo="/friends"
                                iconSrc={brosIcon}
                                height={50}
                                width={50}
                            />
                            <RoutingButton
                                label="Profile"
                                routingTo="/profile-page"
                                iconSrc={profileIcon}
                                height={50}
                                width={50}
                            />
                        </div>
                    </div>

                    <hr className="line-divider" />
                </div>

                
                <div className="user-schedule-box">
                    <ParagraphText text="Here's your schedule for the day." />

                    {loading && <p className="message-text">Loading your workouts...</p>}

                    {error && <p className="error-message">{error}</p>}

                    {!loading && !error && schedule.length === 0 && (
                        <p className="message-text">You don't have any workouts scheduled for today!</p>
                    )}

                    {/* Loads user's schedule based on day/completion status */}
                    {!loading && !error && activeWorkouts.map((workout) => (
                        <UserWorkoutWidget
                            key={workout._id}
                            day={workout.dayOfWeek}
                            startTime={workout.startTime}
                            endTime={workout.endTime}
                            activity={workout.activity}
                            completedToday={false}
                            onComplete={(checked) =>
                                handleWorkoutCompletion(workout._id, checked)
                            }
                        />
                    ))}

                    {/* Displays message when workout is completed and when all workouts are completed for the day */}
                    {!loading && !error && completedWorkouts.map((workout) => (
                        <p key={workout._id}>
                            <strong className="completed-text">✓ Completed:</strong> {workout.activity}
                        </p>
                    ))}

                    {!loading && !error &&
                        schedule.length > 0 &&
                        activeWorkouts.length === 0 && (
                            <p className="message-text">You've completed all your workouts today!</p>
                        )}
                </div>


                <div className="no-gap-group-vertical">
                    <div className="header">
                        <PageTitle label="Your Bros" />
                    </div>

                    <hr className="line-divider" />
                </div>

                {/* Displays your bros' workouts and completion status. Bug them with the bug and congratulate icons */}
                <div className="bros-schedule-box">
                    <ParagraphText text="Check in on your bros and make sure they're keeping up with their workouts!" />

                    {friendsLoading && <p className="message-text">Loading your bros...</p>}

                    {friendsError && (
                        <p className="error-message">{friendsError}</p>
                    )}

                    {!friendsLoading && !friendsError && friends.length === 0 && (
                        <p className="message-text">None of your bros have workouts scheduled today!</p>
                    )}
                    
                    {!friendsLoading && !friendsError && friends.map((friend) =>
                        friend.workouts.map((workout) => {
                            const status = getBroWorkoutStatus(workout);
                            const workoutKey = `${friend.friendId}-${workout.scheduleId}`;

                            const action =
                                status === "completed" ? "congratulate" : "bug";

                            return (
                                <BroWorkoutWidget
                                    key={workoutKey}
                                    status={status}
                                    name={friend.username}
                                    startTime={workout.startTime}
                                    endTime={workout.endTime}
                                    activity={workout.activity}
                                    icon={
                                        status === "completed"
                                            ? congratsIcon
                                            : bugIcon
                                    }
                                    onClick={() =>
                                        handleFriendAction(
                                            friend.friendId,
                                            workoutKey,
                                            action
                                        )
                                    }
                                    disabled={sendingFriendAction === workoutKey}
                                />
                            );
                        })
                    )}
                    {friendActionError && (
                        <p className="error-message">{friendActionError}</p>
                    )}

                    {friendActionSuccess && (
                        <p>{friendActionSuccess}</p>
                    )}

                </div>
            </div>
        </main>
    );
}
