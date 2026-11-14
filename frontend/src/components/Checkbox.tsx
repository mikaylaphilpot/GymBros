type CheckboxProps = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

//On HomePage and EditSchedulePage, triggers corresponding events when selected, like completing a workout or adding a Day header
export default function Checkbox({label, checked, onChange}: CheckboxProps) {
    return (
        <label className="checkbox-label">
            <input className="checkbox" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
            {label}
        </label>
    )
}