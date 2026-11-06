type ParagraphText = {
    text: string;
}

export default function ParagraphText({text}: ParagraphText) {
    return (
        <p className="general-text">{text}</p>
    );
}