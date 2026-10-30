import { useState } from "react";
import Checkbox from "./Checkbox";

type UserWorkoutWidgetProps = {
    day: string;
    startTime: string 
    endTime: string;
    activity: string;
    profilePage?: number;
}

export default function UserWorkoutWidget({day, startTime, endTime, activity, profilePage}: UserWorkoutWidgetProps) {
    const [completed, setCompleted] = useState(false);

    if (profilePage) {
        return (
            <div className="profile-schedule-widgets general-text">
                <p><strong>{day}: </strong>{startTime} - {endTime}, {activity}</p>
            </div>
        )
    }
    else {
        return (
            <div className="user-workout-widget">
                <p>{day}: {startTime} - {endTime}, {activity}</p>
                <Checkbox label="" checked={completed} onChange={setCompleted} />
            </div>
        );
    }  
}