import PageTitle from "../components/PageTitle";
import ParagraphText from "../components/ParagraphText";
import Icon from "../components/Icon";

export default function ForgotPswdPage() {
    return (
        //i accidentallyu made this page called forgotpswd when i was building the home page,,,remake this pls!
        <div className="white-container">
            <div className="header">
                <PageTitle label="Hey, Bro!" />
                <Icon src="react.svg" height={200} width={200} />
                <Icon src="react.svg" height={200} width={200} />
            </div>

            <div className="user-schedule-box">
                <ParagraphText text="Here's your schedule for the day." />
            </div>


        </div>


        


    );
}