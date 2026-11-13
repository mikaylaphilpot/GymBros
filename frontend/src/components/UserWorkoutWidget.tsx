import Checkbox from "./Checkbox";

type UserWorkoutWidgetProps = {
    day: string;
    startTime: string;
    endTime: string;
    activity: string;
    profilePage?: number;
    completedToday?: boolean;
    onComplete?: (checked: boolean) => void;
}

//Displays user's schedule in widget form on HomePage
export default function UserWorkoutWidget({
    day,
    startTime,
    endTime,
    activity,
    profilePage,
    completedToday = false,
    onComplete
}: UserWorkoutWidgetProps) {

    if (profilePage) {
        return (
            <div className="profile-schedule-widgets general-text">
                <p>
                    <strong>{day}: </strong>
                    {startTime} - {endTime}, {activity}
                </p>
            </div>
        );
    }

    return (
        <div className="user-workout-widget">
            <p>{day}: {startTime} - {endTime}, {activity}</p>

            <Checkbox
                label=""
                checked={completedToday}
                onChange={(checked) => onComplete?.(checked)}
            />
        </div>
    );
}
