import Icon from "./Icon";
import addIcon from "../assets/addIcon.png"

type AddDayItemProps = {
    day: string;
    onAdd: (day: string) => void;
}

//On EditSchedulePage, Adds Day header when the corresponding day checkbox is selected
export default function AddDayItem({day, onAdd}: AddDayItemProps) {

    return (
        <div className="schedule-item-header general-text">
            <h2>{day}</h2>
            <Icon src={addIcon} height={40} width={40} onClick={() => onAdd(day)} alt="plus-icon" />
        </div>

    )
}
