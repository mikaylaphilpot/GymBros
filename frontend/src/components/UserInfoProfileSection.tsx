import RoutingButton from "./RoutingButton";
import editIcon from "../assets/editIcon.png"
import { useState } from "react";
import showPswdIcon from "../assets/showPswdIcon.png"
import hidePswdIcon from "../assets/hidePswdIcon.png"
import Icon from "./Icon";

type UserInfoProfileSectionProps = {
    title: string;

    name: string;
    username: string;
    email: string;
    password: string;
}

export default function UserInfoProfileSection({title, name, username, email, password}: UserInfoProfileSectionProps) {
    const [showPswd, setShowPswd] = useState(false);

    function togglePasswordVisibility() {
        setShowPswd(!showPswd);
    }
    
    return (
        <div className="profile-information-box">
            <div className="header profile-no-gap-group">
                <h2>{title}</h2>
                {/* chnage where these buttons go to when create edit screen */}
                <RoutingButton label="Edit" routingTo="/edit-user-info-page" iconSrc={editIcon} />
            </div>
            
            <p><strong>Name: </strong>{name}</p>
            <p><strong>Username: </strong>{username}</p>
            <p><strong>Email: </strong>{email}</p>
            

            <p>
                <strong>Password: </strong>
                {showPswd ? password : "*".repeat(password.length)}

                <button type="button" className="password-toggle" onClick={togglePasswordVisibility}>
                    <Icon src={showPswd ? hidePswdIcon : showPswdIcon} height={20} width={20} />
                </button>

            </p>
        </div>

    )
}