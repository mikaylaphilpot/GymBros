import { useState } from "react";
import showPswdIcon from "../assets/showPswdIcon.png";
import hidePswdIcon from "../assets/hidePswdIcon.png";
import Icon from "./Icon";

type EditUserInfoProps = {
    name: string;
    username: string;
    email: string;
    currentPassword: string;
    newPassword: string;
    onChange: (
        inputName: "name" | "username" | "currentPassword" | "newPassword",
        value: string
    ) => void;
};

//Tracks user input as they update or add their information to EditUserInfoPage
export default function EditUserInfo({
    name,
    username,
    email,
    currentPassword,
    newPassword,
    onChange
}: EditUserInfoProps) {
    const [showCurrentPswd, setShowCurrentPswd] = useState(false);
    const [showNewPswd, setShowNewPswd] = useState(false);

    return (
        <div className="profile-information-box edit-profile-box general-text">

            <div className="edit-profile-box-item">
                <label htmlFor="name"><strong>Name: </strong></label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    value={name}
                    onChange={(event) => onChange("name", event.target.value)}
                />
            </div>

            <div className="edit-profile-box-item">
                <label htmlFor="username"><strong>Username: </strong></label>
                <input
                    type="text"
                    id="username"
                    name="username"
                    value={username}
                    onChange={(event) => onChange("username", event.target.value)}
                />
            </div>

            <div className="edit-profile-box-item">
                <label htmlFor="email"><strong>Email: </strong></label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    value={email}
                    readOnly
                />
            </div>

            {/* Must input password no matter what chnage you make */}
            <div className="edit-profile-box-item">
                <label htmlFor="currentPassword">
                    <strong>Current Password: </strong>
                </label>
                <input
                    type={showCurrentPswd ? "text" : "password"}
                    id="currentPassword"
                    name="currentPassword"
                    value={currentPassword}
                    onChange={(event) =>
                        onChange("currentPassword", event.target.value)
                    }
                />

                <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowCurrentPswd(!showCurrentPswd)}
                >
                    <Icon
                        src={showCurrentPswd ? hidePswdIcon : showPswdIcon}
                        height={20}
                        width={20}
                        alt="eye-icon"
                    />
                </button>
            </div>

            {/* New password is optional */}
            <div className="edit-profile-box-item">
                <label htmlFor="newPassword">
                    <strong>New Password: </strong>
                </label>
                <input
                    type={showNewPswd ? "text" : "password"}
                    id="newPassword"
                    name="newPassword"
                    placeholder="Leave blank to keep current password"
                    value={newPassword}
                    onChange={(event) =>
                        onChange("newPassword", event.target.value)
                    }
                />

                <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowNewPswd(!showNewPswd)}
                >
                    <Icon
                        src={showNewPswd ? hidePswdIcon : showPswdIcon}
                        height={20}
                        width={20}
                        alt="eye-icon"
                    />
                </button>
            </div>

        </div>
    );
}
