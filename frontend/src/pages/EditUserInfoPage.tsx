import { useState } from "react";
import RoutingButton from "../components/RoutingButton"
import "../styles/homepage.css"

import cancelIcon from "../assets/cancelIcon.png"
import PageTitle from "../components/PageTitle"
import EditUserInfo from "../components/EditUserInfo"



export default function EditUserInfoPage() {
    const [name, setName] = useState("John Gymborough");
    const [username, setUsername] = useState("Jymbro20");
    const [email, setEmail] = useState("johnGym@gmail.com");
    const [password, setPassword] = useState("");


    function handleChange(inputName: "name" | "username" | "email" | "password", value: string) {
        switch (inputName) {
            case "name":
                setName(value);
                break;

            case "username":
                setUsername(value);
                break;

            case "email":
                setEmail(value);
                break;

            case "password":
                setPassword(value);
                break;
        }
    }

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

            <EditUserInfo name={name} username={username} email={email} password={password} onChange={handleChange}/>

            <RoutingButton label="Save" routingTo="/profile-page" iconSrc="" normalButton={1}/>

        </div>

    )
}