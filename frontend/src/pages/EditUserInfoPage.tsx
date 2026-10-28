import RoutingButton from "../components/RoutingButton"
import "../styles/homepage.css"

import cancelIcon from "../assets/cancelIcon.png"
import PageTitle from "../components/PageTitle"
import EditUserInfo from "../components/EditUserInfo"



export default function EditUserInfoPage() {
    return (
        <div className="white-container">
            <div className="left-align-button">
                <RoutingButton label="Cancel" routingTo="/profile-page" iconSrc={cancelIcon} />
            </div>

            <div className="no-gap-group-vertical">
                <div className="header">
                    <PageTitle label="Edit User Information" />
                </div>
                <hr className="line-divider" />
            </div>

            <EditUserInfo name="John Gymborough" username="Jymbro20" email="johnGym@gmail.com" password="hello123" />

            <RoutingButton label="Save" routingTo="/profile-page" iconSrc="" normalButton={1}/>

        </div>

    )
}