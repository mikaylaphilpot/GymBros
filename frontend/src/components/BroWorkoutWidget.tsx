import Icon from "./Icon";
import "../styles/homepage.css"

type BroWorkoutWidgetProps = {
    status: string;
    name: string;
    startTime: string //might have to chnage to time or something, bc its gonan be #:## yk?
    endTime: string;
    activity: string;
    icon: string;
}

export default function BroWorkoutWidget({status, name, startTime, endTime, activity, icon}: BroWorkoutWidgetProps) {
    const className1: string = "bro-workout-widget";
    const combined: string = `${status} ${className1}`;
    //prob do if statement here abt which icon to return and which color the background should be
    return (
        <div className={combined}>
            <p>{name}: {startTime} - {endTime}, {activity}</p>
            <Icon src={icon} height={40} width={40} />
        </div>
    );
}