import { useState, useEffect } from "react";
import {
    getSchedule,
    addScheduleItem,
    updateSchedule,
    deleteSchedule
} from "../api/schedule";
import RoutingButton from "../components/RoutingButton";
import ParagraphText from "../components/ParagraphText";
import AddScheduleItem from "../components/AddScheduleItem";
import "../styles/homepage.css";
import { useNavigate } from "react-router";

import cancelIcon from "../assets/cancelIcon.png";
import PageTitle from "../components/PageTitle";
import ScheduleCheckboxes from "../components/ScheduleCheckboxes";
import AddDayItem from "../components/AddDayItem";

const days = ["Sun", "Mon", "Tues", "Wed", "Thurs", "Fri", "Sat"];

type ScheduleDraft = {
    id: number;
    mongoId?: string;
    day: string;
    startTime: string;
    endTime: string;
    activity: string;
};

const shortDayNames: Record<string, string> = {
    Sunday: "Sun",
    Monday: "Mon",
    Tuesday: "Tues",
    Wednesday: "Wed",
    Thursday: "Thurs",
    Friday: "Fri",
    Saturday: "Sat"
};

const fullDayNames: Record<string, string> = {
    Sun: "Sunday",
    Mon: "Monday",
    Tues: "Tuesday",
    Wed: "Wednesday",
    Thurs: "Thursday",
    Fri: "Friday",
    Sat: "Saturday"
};

function convertTo24Hour(time: string): string {
    const [timePart, period] = time.split(" ");
    let [hour, minute] = timePart.split(":").map(Number);

    if (period === "PM" && hour !== 12) hour += 12;
    if (period === "AM" && hour === 12) hour = 0;

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function convertTo12Hour(time: string): string {
    const [hourString, minute] = time.split(":");
    const hour = Number(hourString);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;

    return `${displayHour}:${minute} ${period}`;
}

export default function EditSchedulePage() {
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [scheduleItems, setScheduleItems] = useState<ScheduleDraft[]>([]);
    const [nextId, setNextId] = useState(1);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    function handleDayChange(day: string, checked: boolean) {
        if (checked) {
            setSelectedDays(prev => [...prev, day]);
        } else {
            setSelectedDays(prev =>
                prev.filter(selectedDay => selectedDay !== day)
            );

            setScheduleItems(prev =>
                prev.filter(item => item.day !== day)
            );
        }
    }

    // Add a new, empty schedule entry for the selected day.
    function onAdd(day: string) {
        setScheduleItems(prev => [
            ...prev,
            {
                id: nextId,
                day,
                startTime: "",
                endTime: "",
                activity: ""
            }
        ]);

        setNextId(prev => prev + 1);
    }

    // Update the specific field of the specific schedule entry.
    function handleItemChange(
        id: number,
        field: "startTime" | "endTime" | "activity",
        value: string
    ) {
        setScheduleItems(prev =>
            prev.map(item =>
                item.id === id
                    ? { ...item, [field]: value }
                    : item
            )
        );
    }

    async function handleSave() {
        try {
            for (const item of scheduleItems) {
                if (!item.startTime || !item.endTime || !item.activity.trim()) {
                    throw new Error("Please complete all schedule entries before saving.");
                }

                const entry = {
                    dayOfWeek: fullDayNames[item.day],
                    startTime: convertTo12Hour(item.startTime),
                    endTime: convertTo12Hour(item.endTime),
                    activity: item.activity.trim()
                };

                if (item.mongoId) {
                    // Update an existing database entry
                    await updateSchedule(item.mongoId, entry);
                } else {
                    // Create a new database entry
                    await addScheduleItem(entry);
                }
            }

            alert("Schedule saved successfully!");
            navigate("/profile-page");

        } catch (error) {
            alert(error instanceof Error ? error.message : "Unable to save schedule.");
        }
    }

    async function handleDelete(id: number) {
        const item = scheduleItems.find(item => item.id === id);

        if (!item) return;

        // Ask the user to confirm before deleting.
        const confirmed = window.confirm(
            "Are you sure you want to delete this schedule entry?"
        );

        if (!confirmed) return;

        try {
            // Only send a DELETE request if the entry already exists in MongoDB.
            if (item.mongoId) {
                await deleteSchedule(item.mongoId);
            }

            // Remove the entry from the frontend either way.
            setScheduleItems(prev =>
                prev.filter(item => item.id !== id)
            );

        } catch (error) {
            alert(error instanceof Error ? error.message : "Unable to delete schedule.");
        }
    }



    useEffect(() => {
        async function loadSchedule() {
            try {
                setIsLoading(true);

                const entries = await getSchedule();

                // Convert database entries into the format used by our form
                const drafts: ScheduleDraft[] = entries.map((entry, index) => ({
                    id: index + 1,
                    mongoId: entry._id,
                    day: shortDayNames[entry.dayOfWeek],
                    startTime: convertTo24Hour(entry.startTime),
                    endTime: convertTo24Hour(entry.endTime),
                    activity: entry.activity
                }));

                setScheduleItems(drafts);

                // Automatically check the days that already have schedule entries
                setSelectedDays([...new Set(drafts.map(item => item.day))]);

                setNextId(entries.length + 1);

            } catch (error) {
                setError(error instanceof Error ? error.message : "Unable to load schedule.");
            } finally {
                setIsLoading(false);
            }
        }

        loadSchedule();
    }, []);

    return (
        <main>
            <div className="white-container">
                <div className="left-align-button">
                    <RoutingButton
                        label="Cancel"
                        routingTo="/profile-page"
                        iconSrc={cancelIcon}
                        height={30}
                        width={30}
                    />
                </div>

                <div className="no-gap-group-vertical">
                    <div className="header">
                        <PageTitle label="Edit Schedule" />
                    </div>
                    <hr className="line-divider" />
                </div>

                <ParagraphText text="Select your workout days and input times for each of your activities." />

                {isLoading && <p className="message-text">Loading your saved schedule...</p>}

                {error && <p className="error-message">{error}</p>}


                {!isLoading && !error && (
                    <>
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

                                        {scheduleItems
                                            .filter(item => item.day === day)
                                            .map(item => (
                                                <AddScheduleItem
                                                    key={item.id}
                                                    id={item.id}
                                                    startTime={item.startTime}
                                                    endTime={item.endTime}
                                                    activity={item.activity}
                                                    onChange={handleItemChange}
                                                    onDelete={handleDelete}
                                                />
                                            ))}
                                    </div>
                                ))}
                        </div>
                    </>
                )}

                {!isLoading && !error && (
                    <RoutingButton
                        label="Save"
                        routingTo=""
                        iconSrc=""
                        height={50}
                        width={50}
                        normalButton={1}
                        onClick={handleSave}
                    />
                )}
            </div>
        </main>
    );
}
