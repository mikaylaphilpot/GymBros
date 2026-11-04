import RoutingButton from "../components/RoutingButton"
import "../styles/homepage.css"

import backArrow from "../assets/backArrow.png"
import PageTitle from "../components/PageTitle"
import UserInfoProfileSection from "../components/UserInfoProfileSection"
import WorkoutScheduleProfileSection from "../components/WorkoutScheduleProfileSection"



export default function ProfilePage() {
    return (
        <div className="white-container">
            <div className="left-align-button">
                <RoutingButton label="Back" routingTo="/home-page" iconSrc={backArrow} />
            </div>

            <div className="no-gap-group-vertical">
                <div className="header">
                    <PageTitle label="Profile" />
                </div>
                <hr className="line-divider" />
            </div>

            <WorkoutScheduleProfileSection title="Workout Schedule" workouts=""/> {/* hopefully i can j link the user's workouts from the database then parse them in the widget? Like pass an array of saved workouts then pull dif parts of it out in the component to display it corrcetly? idk*/}
            <UserInfoProfileSection title="User Information" name="John Gymborough" username="Jymbro20" email="johnGym@gmail.com" password="hello123" />

            <RoutingButton label="Sign Out" routingTo="/home-page" iconSrc="" normalButton={1}/>

        </div>

    )
}