type CheckboxProps = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export default function Checkbox({label, checked, onChange}: CheckboxProps) {
    return (
        <label className="checkbox-label">
            <input className="checkbox" type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
            {label}
        </label>
    )
}