import { Link } from 'react-router'

type ButtonProps = {
    label: string;
    routingTo: string; 
};


export default function RoutingButton({label, routingTo}: ButtonProps) {
    return (
        <Link to={routingTo} className="buttons">
            {label}
        </Link>
    );
}