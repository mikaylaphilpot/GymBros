import Checkbox from "./Checkbox";

type ScheduleCheckboxesProps = {
    day: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

//On EditSchedulePage, display corresponding Day headers when clicked
export default function ScheduleCheckboxes({day, checked, onChange}: ScheduleCheckboxesProps ) {
    return (
        <Checkbox label={day} checked={checked} onChange={onChange} /> 
    );
}
