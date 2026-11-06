import { useState } from "react";
import RoutingButton from "../components/RoutingButton"
import ParagraphText from "../components/ParagraphText"
import AddScheduleItem from "../components/AddScheduleItem";
import "../styles/homepage.css"

import cancelIcon from "../assets/cancelIcon.png"
import PageTitle from "../components/PageTitle"
import ScheduleCheckboxes from "../components/ScheduleCheckboxes"
import AddDayItem from "../components/AddDayItem"


const days = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];



export default function EditSchedulePage() {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [itemCounts, setItemCounts] = useState<Record<string, number>>({});

    function handleDayChange(day: string, checked: boolean) {
        if (checked) {
            setSelectedDays([...selectedDays, day]);
        }
        else {
            setSelectedDays(selectedDays.filter(selectedDay => selectedDay !== day));
        }
    }

    function onAdd(day: string) {
        setItemCounts(prev => ({
            ...prev,
            [day]: (prev[day] || 0) + 1
        }));
    }



    return (
        <div className="white-container">
            <div className="left-align-button">
                <RoutingButton label="Cancel" routingTo="/profile-page" iconSrc={cancelIcon} />
            </div>

            <div className="no-gap-group-vertical">
                <div className="header">
                    <PageTitle label="Edit Schedule" />
                </div>
                <hr className="line-divider" />
            </div>

            <ParagraphText text="Select your workout days and input times for each of your activities." />

            <div className="schedule-checkboxes general-text">
                {days.map(day => (
                    <ScheduleCheckboxes 
                        key={day} 
                        day={day} 
                        checked={selectedDays.includes(day)} 
                        onChange={(checked) => handleDayChange(day, checked)} 
                    />

                ))}
            </div>

            <div className="add-schedule-items">
                {days
                    .filter(day => selectedDays.includes(day))
                    .map(day => (
                        <div key={day}>
                            <AddDayItem
                                day={day}
                                onAdd={onAdd}
                            />

                            {Array.from(
                                { length: itemCounts[day] || 0 },
                                (_, index) => (
                                    <AddScheduleItem key={index} />
                                )
                            )}
                        </div>
                    ))}
            </div>

            <RoutingButton label="Save" routingTo="/profile-page" iconSrc="" normalButton={1}/>

        </div>

    )
}
