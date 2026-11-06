import Checkbox from "./Checkbox";

type ScheduleCheckboxesProps = {
    day: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export default function ScheduleCheckboxes({day, checked, onChange}: ScheduleCheckboxesProps ) {
    return (
        <Checkbox label={day} checked={checked} onChange={onChange} /> 
    );
}
