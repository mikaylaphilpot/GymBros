import { useEffect, useState } from "react";
import RoutingButton from "./RoutingButton";
import editIcon from "../assets/editIcon.png";
import UserWorkoutWidget from "./UserWorkoutWidget";
import { getSchedule, type ScheduleEntry } from "../api/schedule";

type WorkoutScheduleProfileSectionProps = {
    title: string;
};

export default function WorkoutScheduleProfileSection({
    title
}: WorkoutScheduleProfileSectionProps) {
    const [workouts, setWorkouts] = useState<ScheduleEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadSchedule() {
            try {
                const userSchedule = await getSchedule();
                setWorkouts(userSchedule);
            } catch (error) {
                setError(
                    error instanceof Error
                        ? error.message
                        : "Unable to load workout schedule."
                );
            } finally {
                setLoading(false);
            }
        }

        loadSchedule();
    }, []);

    // Display workouts in weekday order.
    const dayOrder = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];

    const sortedWorkouts = [...workouts].sort(
        (a, b) =>
            dayOrder.indexOf(a.dayOfWeek) -
            dayOrder.indexOf(b.dayOfWeek)
    );

    return (
        <div className="profile-schedule-box">
            <div className="header profile-no-gap-group">
                <h2>{title}</h2>
                <RoutingButton
                    label="Edit"
                    routingTo="/edit-schedule-page"
                    iconSrc={editIcon}
                    height={30}
                    width={30}
                />
            </div>

            {loading && <p className="message-text">Loading workout schedule...</p>}

            {error && <p className="error-message">{error}</p>}

            {!loading && !error && sortedWorkouts.length === 0 && (
                <p className="message-text">You haven't added any workouts to your schedule yet.</p>
            )}

            {!loading && !error && sortedWorkouts.map((workout) => (
                <UserWorkoutWidget
                    key={workout._id}
                    day={workout.dayOfWeek}
                    startTime={workout.startTime}
                    endTime={workout.endTime}
                    activity={workout.activity}
                    profilePage={1}
                />
            ))}
        </div>
    );
}
