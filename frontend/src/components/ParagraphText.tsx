type ParagraphText = {
    text: string;
}

//Displays general text on GymBros
export default function ParagraphText({text}: ParagraphText) {
    return (
        <p className="general-text">{text}</p>
    );
}