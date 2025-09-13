import { useNow } from '../../context/Now';
import { getDailyEvents, getNextEvent, getCurrentEvents } from '../../data/events';

export default function EventsSection() {
    const { application } = useNow();
    const dailyEvents = getDailyEvents(application);
    const nextEvent = getNextEvent(application);
    const currentEvents = getCurrentEvents(application);

    return (
        <div className="glass mt-4 p-4">
            <h3 className="text-lg font-bold mb-3">Daily Events (Asia/Shanghai Time)</h3>

            {/* Current Events */}
            {currentEvents.length > 0 && (
                <div className="mb-4">
                    <h4 className="font-semibold text-green-300">Happening Now</h4>
                    {currentEvents.map((event, index) => (
                        <div key={index} className="flex items-center p-2 my-2 bg-green-900 bg-opacity-20 rounded border-l-4 border-green-500">
                            <div className="text-2xl mr-3">{event.type === 'grandma' ? '👵' : '🐢'}</div>
                            <div className="flex-1">
                                <div className="font-medium">{event.name}</div>
                                <div className="text-sm opacity-80">
                                    Until {event.end.toFormat('HH:mm')}
                                </div>
                                <div className="text-xs opacity-60">{event.location}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Next Event */}
            {nextEvent && currentEvents.length === 0 && (
                <div className="mb-4">
                    <h4 className="font-semibold">Next Event</h4>
                    <div className="flex items-center p-2 my-2 bg-blue-900 bg-opacity-20 rounded">
                        <div className="text-2xl mr-3">{nextEvent.type === 'grandma' ? '👵' : '🐢'}</div>
                        <div className="flex-1">
                            <div className="font-medium">{nextEvent.name}</div>
                            <div className="text-sm opacity-80">
                                {nextEvent.start.toFormat('HH:mm')} - {nextEvent.end.toFormat('HH:mm')}
                            </div>
                            <div className="text-xs opacity-60">{nextEvent.location}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* All Daily Events */}
            <div>
                <h4 className="font-semibold">All Events Today</h4>
                {dailyEvents.map((event, index) => (
                    <div key={index} className="flex items-center p-2 my-2 bg-gray-900 bg-opacity-20 rounded">
                        <div className="text-2xl mr-3">{event.type === 'grandma' ? '👵' : '🐢'}</div>
                        <div className="flex-1">
                            <div className="font-medium">{event.name}</div>
                            <div className="text-sm opacity-80">
                                {event.start.toFormat('HH:mm')} - {event.end.toFormat('HH:mm')}
                            </div>
                            <div className="text-xs opacity-60">{event.location}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}