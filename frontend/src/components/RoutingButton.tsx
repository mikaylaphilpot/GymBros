import { Link } from 'react-router'
import Icon from './Icon';

type ButtonProps = {
    label: string;
    routingTo: string; 
    iconSrc: string;
    height?: number;
    width?: number;
    normalButton?: number;
    onClick?: () => void;
};


export default function RoutingButton({label, routingTo, iconSrc, height = 60, width = 60, normalButton, onClick}: ButtonProps) {
    if (onClick) {
        return (
            <button type="button" className={normalButton ? "normal-button" : "buttons"} onClick={onClick} >
                {normalButton ? label : (
                    <>
                        <Icon src={iconSrc} height={height} width={width} alt="button-icon"/>
                        {label}
                    </>
                )}
            </button>
        );
    }
    
    if (normalButton) {
            return (
                <Link to={routingTo} className="normal-button">
                    {label}
                </Link>  
            );
        }
    else {
        return (
            <Link to={routingTo} className="buttons">
                <Icon src={iconSrc} height={height} width={width} alt="button-icon"/>
                {label}
            </Link>
        );

    }
    
}