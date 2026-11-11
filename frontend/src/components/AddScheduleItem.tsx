import RoutingButton from "./RoutingButton";
import deleteIcon from "../assets/deleteIcon.png"

type AddScheduleItemProps = {
    id: number;
    startTime: string;
    endTime: string;
    activity: string;
    onChange: (id: number, field: "startTime" | "endTime" | "activity", value: string) => void;
    onDelete: (id: number) => void;
};

export default function AddScheduleItem({
    id,
    startTime,
    endTime,
    activity,
    onChange,
    onDelete
}: AddScheduleItemProps) {
    return (
        <div className="schedule-item-box general-text">

            <div className="schedule-item">
                <label htmlFor={`startTime-${id}`}>Start Time</label>
                <input
                    type="time"
                    id={`startTime-${id}`}
                    value={startTime}
                    onChange={(event) => onChange(id, "startTime", event.target.value)}
                />
            </div>

            <div className="schedule-item">
                <label htmlFor={`endTime-${id}`}>End Time</label>
                <input
                    type="time"
                    id={`endTime-${id}`}
                    value={endTime}
                    onChange={(event) => onChange(id, "endTime", event.target.value)}
                />
            </div>

            <div className="schedule-item">
                <label htmlFor={`activity-${id}`}>Activity</label>
                <input
                    type="text"
                    id={`activity-${id}`}
                    value={activity}
                    onChange={(event) => onChange(id, "activity", event.target.value)}
                />
            </div>

            <div className="delete-button">
                <RoutingButton
                    label="Delete"
                    routingTo=""
                    iconSrc={deleteIcon}
                    height={20}
                    width={20}
                    onClick={() => onDelete(id)}
                />
            </div>

        </div>
    );
}
