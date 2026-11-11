import RoutingButton from "./RoutingButton";
import editIcon from "../assets/editIcon.png";

type UserInfoProfileSectionProps = {
    title: string;
    name: string;
    username: string;
    email: string;
};

export default function UserInfoProfileSection({
    title,
    name,
    username,
    email
}: UserInfoProfileSectionProps) {
    return (
        <div className="profile-information-box">
            <div className="header profile-no-gap-group">
                <h2>{title}</h2>
                <RoutingButton
                    label="Edit"
                    routingTo="/edit-user-info-page"
                    iconSrc={editIcon}
                    height={60}
                    width={90}
                />
            </div>

            <p><strong>Name: </strong>{name}</p>
            <p><strong>Username: </strong>{username}</p>
            <p><strong>Email: </strong>{email}</p>
            <p><strong>Password: </strong>••••••••</p>
        </div>
    );
}
