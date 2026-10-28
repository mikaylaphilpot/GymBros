import PageTitle from "../components/PageTitle";
import ParagraphText from "../components/ParagraphText";
import BroWorkoutWidget from "../components/BroWorkoutWidget";
import RoutingButton from "../components/RoutingButton";
import '../styles/homepage.css';

import bugIcon from "../assets/bugIcon.png";
import congratsIcon from "../assets/congratsIcon.png";
import brosIcon from "../assets/brosIcon.png";
import profileIcon from "../assets/profileIcon.png";
import UserWorkoutWidget from "../components/UserWorkoutWidget";

export default function HomePage() {
    return (
        <div className="white-container">

            <div className="no-gap-group-vertical">
                <div className="header">
                    <PageTitle label="Hey, Bro!" />
                    <div className="no-gap-group-horizontal">
                        <RoutingButton label="Bros" routingTo="/home-page" iconSrc={brosIcon} />
                        <RoutingButton label="Profile" routingTo="/profile-page" iconSrc={profileIcon} />   
                    </div>
                </div>

                <hr className="line-divider" />{/* do dividing line for all headers? like have thin line where title and icons r right above it for this one*/}
            </div>

            <div className="user-schedule-box">
                <ParagraphText text="Here's your schedule for the day." />
                <UserWorkoutWidget day="Tuesday" startTime="12:00pm" endTime="1:00pm" activity="Swim" />
            </div>

            <div className="no-gap-group-vertical">
                <div className="header">
                    <PageTitle label="Your Bros" />
                </div>

                <hr className="line-divider" />
            </div>


            <div className="bros-schedule-box">
                <ParagraphText text="Check in on your bros and make sure they're keeping up with their workouts!" />
                <BroWorkoutWidget status="overdue" name="Mikayla" startTime="9:00am" endTime="10:30am" activity="Walk" icon={bugIcon}/> {/* figure out how to do logic to what icon shows up and what color the background is*/}
                <BroWorkoutWidget status="completed" name="Katie" startTime="10:00am" endTime="11:30am" activity="Tennis" icon={congratsIcon}/> {/* prob will eventually pass varibales to these instead of string literals, update the widget component too, but like "Mikayla" will prob be like {name} where the name comes from the backend and is passed to the component*/}
                <BroWorkoutWidget status="default" name="Melinda" startTime="11:30am" endTime="12:30pm" activity="Run" icon={bugIcon}/>
            </div>


        </div>

    );
}