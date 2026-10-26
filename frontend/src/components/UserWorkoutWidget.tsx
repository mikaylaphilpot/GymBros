import { useState } from "react";
import Checkbox from "./Checkbox";

type UserWorkoutWidgetProps = {
    day: string;
    startTime: string 
    endTime: string;
    activity: string;
}

export default function UserWorkoutWidget({day, startTime, endTime, activity}: UserWorkoutWidgetProps) {
    const [completed, setCompleted] = useState(false);
    
    return (
        <div className="user-workout-widget">
            <p>{day}: {startTime} - {endTime}, {activity}</p>
            <Checkbox label="" checked={completed} onChange={setCompleted} />
        </div>
    );
}