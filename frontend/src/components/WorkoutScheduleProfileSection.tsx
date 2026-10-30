import RoutingButton from "./RoutingButton";
import editIcon from "../assets/editIcon.png"
import UserWorkoutWidget from "./UserWorkoutWidget";

type WorkoutScheduleProfileSectionProps = {
    title: string;
    workouts: string; //idk abt this yet...
}

export default function WorkoutScheduleProfileSection({title}: WorkoutScheduleProfileSectionProps) {
    return (
        <div className="profile-schedule-box">
            <div className="header profile-no-gap-group">
                <h2>{title}</h2>
                {/* chnage where these buttons go to when create edit screen */}
                <RoutingButton label="Edit" routingTo="/edit-schedule-page" iconSrc={editIcon} />
            </div>
            
            <UserWorkoutWidget day="Monday" startTime="10:00am" endTime="11:00am" activity="Tennis" profilePage={1}/>
            <UserWorkoutWidget day="Monday" startTime="12:00pm" endTime="1:00pm" activity="Swim"profilePage={1} />
            <UserWorkoutWidget day="Tuesday" startTime="4:00pm" endTime="5:00pm" activity="Run" profilePage={1} />
            <UserWorkoutWidget day="Thursday" startTime="12:00pm" endTime="1:00pm" activity="Swim" profilePage={1} />
            
        </div>
    )
}