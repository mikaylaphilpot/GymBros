import "../styles/homepage.css"

type IconProps = {
    src: string;
    height: number;
    width: number;
    onClick?: () => void;
    alt: string;
}

//Displays various icons, buttons, and navigational items on GymBros
export default function Icon({src, height, width, onClick, alt}: IconProps) {
    return (
        <img src={src} height={height} width={width} className="iconImage" onClick={onClick} alt={alt}/>
    );
}
