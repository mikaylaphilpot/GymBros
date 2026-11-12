const apiBaseUrl = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
const scheduleApiUrl = `${apiBaseUrl}/api/schedules`;

// Represents one schedule entry returned by MongoDB.
export interface ScheduleEntry {
    _id: string;
    userId: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    activity: string;
    isCompletedToday: boolean;
}

// Retrieve all schedule entries belonging to the logged-in user.
export async function getSchedule(): Promise<ScheduleEntry[]> {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        throw new Error("You must be logged in to retrieve your schedule.");
    }

    const response = await fetch(scheduleApiUrl, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message ?? "Unable to retrieve schedule.");
    }

    return data as ScheduleEntry[];
}


export interface NewScheduleEntry {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    activity: string;
}

export async function addScheduleItem(entry: NewScheduleEntry): Promise<ScheduleEntry> {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        throw new Error("You must be logged in to add an item to your schedule.");
    }

    const response = await fetch(scheduleApiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(entry)
        
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message ?? "Unable to add schedule.");
    }

    return data as ScheduleEntry;

}


export async function updateSchedule(
    id: string,
    entry: NewScheduleEntry
): Promise<ScheduleEntry> {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        throw new Error("You must be logged in to update your schedule.");
    }

    const response = await fetch(`${scheduleApiUrl}/${id}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(entry)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message ?? "Unable to update schedule.");
    }

    return data as ScheduleEntry;
}

// Delete one schedule entry from the database.
export async function deleteSchedule(id: string): Promise<void> {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        throw new Error("You must be logged in to delete a schedule.");
    }

    const response = await fetch(`${scheduleApiUrl}/${id}`, {
        method: "DELETE",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message ?? "Unable to delete schedule.");
    }
}


export async function getTodaysSchedule(): Promise<ScheduleEntry[]> {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        throw new Error("You must be logged in to retrieve your schedule.");
    }

    const response = await fetch(`${scheduleApiUrl}/today`, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message ?? "Unable to retrieve today's schedule.");
    }

    return data as ScheduleEntry[];
}

export async function updateWorkoutCompletion(
    scheduleId: string,
    isCompletedToday: boolean
): Promise<ScheduleEntry> {
    const token = sessionStorage.getItem("authToken");

    if (!token) {
        throw new Error("You must be logged in to update workout completion.");
    }

    const response = await fetch(
        `${scheduleApiUrl}/${scheduleId}/completion`,
        {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ isCompletedToday })
        }
    );

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message ?? "Unable to update workout completion.");
    }

    return data as ScheduleEntry;
}

