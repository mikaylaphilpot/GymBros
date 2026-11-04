import { Link } from 'react-router'
import Icon from './Icon';

type ButtonProps = {
    label: string;
    routingTo: string; 
    iconSrc: string;
    normalButton?: number;
};


export default function RoutingButton({label, routingTo, iconSrc, normalButton}: ButtonProps) {
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
                <Icon src={iconSrc} height={60} width={60} />
                {label}
            </Link>
        );

    }
    
}