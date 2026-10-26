import "../styles/homepage.css"

type IconProps = {
    src: string;
    height: number;
    width: number;
}

export default function Icon({src, height, width}: IconProps) {
    return (
        <img src={src} height={height} width={width} className="iconImage"/>
    );
}

//prob will do something in here like a switch case where the onClick function will depend on which icon image i passed, like if icon=bugIcon, then send a toast saying "Bugged!", if its the profileIcon, link user to the profile page, yk?