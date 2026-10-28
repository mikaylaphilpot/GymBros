export default function AddScheduleItem() {
    return (

        <div className="schedule-item-box general-text">

            <div className="schedule-item">
                <label htmlFor="startTime">Start Time</label>
                <input type="text" id="startTime" name="startTime" />
            </div>

            <div className="schedule-item">
                <label htmlFor="endTime">End Time</label>
                <input type="text" id="endTime" name="endTime" />
            </div>

            <div className="schedule-item">
                <label htmlFor="activity">Activity</label>
                <input type="text" id="activity" name="activity" />
            </div>

        </div>
    )
}

