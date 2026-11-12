import Icon from "./Icon";
import "../styles/homepage.css"

type BroWorkoutWidgetProps = {
    status: string;
    name: string;
    startTime: string;
    endTime: string;
    activity: string;
    icon: string;
    onClick: () => void;
    disabled?: boolean;
}

export default function BroWorkoutWidget({
    status,
    name,
    startTime,
    endTime,
    activity,
    icon,
    onClick,
    disabled = false
}: BroWorkoutWidgetProps) {
    const className1: string = "bro-workout-widget";
    const combined: string = `${status} ${className1}`;

    return (
        <div className={combined}>
            <p>{name}: {startTime} - {endTime}, {activity}</p>

            <button
                type="button"
                className="bro-workout-action"
                onClick={onClick}
                disabled={disabled}
                aria-label={status === "completed"
                    ? `Congratulate ${name}`
                    : `Bug ${name}`}
            >
                <Icon src={icon} height={40} width={40} alt={status === "completed" ? "Congratulations" : "Bug"} />
            </button>
        </div>
    );
}
