import { useState } from 'react';
import { useNow } from '../../context/Now';
import { getDailyEvents, getNextEvent, getCurrentEvents } from '../../data/events';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function EventsBar() {
    const { application } = useNow();
    const [isExpanded, setIsExpanded] = useState(false);

    const dailyEvents = getDailyEvents(application);
    const nextEvents = dailyEvents.filter(event => event.start > application).slice(0, 3);
    const currentEvents = getCurrentEvents(application);

    const toggleExpand = () => {
        setIsExpanded(!isExpanded);
    };

    // If no events today, don't show the bar
    if (dailyEvents.length === 0) {
        return null;
    }

    return (
        <div className="glass mb-4 overflow-hidden transition-all duration-300">
            {/* Header Bar - Always visible */}
            <div
                className="flex items-center justify-between p-2 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-colors"
                onClick={toggleExpand}
            >
                <div className="flex items-center">
                    <div className="mr-2 transform transition-transform">
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </div>
                    <h3 className="font-semibold">Upcoming Events</h3>
                </div>

                <div className="flex items-center space-x-2">
                    {currentEvents.length > 0 && (
                        <span className="text-xs bg-green-500 bg-opacity-20 text-green-300 px-2 py-1 rounded">
                            Now: {currentEvents[0].name}
                        </span>
                    )}
                    {nextEvents.length > 0 && (
                        <span className="text-xs">
                            Next: {nextEvents[0].start.toFormat('HH:mm')}
                        </span>
                    )}
                </div>
            </div>

            {/* Expandable Content */}
            {isExpanded && (
                <div className="border-t border-white border-opacity-20 p-3">
                    {/* Current Events */}
                    {currentEvents.length > 0 && (
                        <div className="mb-3">
                            <h4 className="font-semibold text-green-300 text-sm mb-1">Happening Now</h4>
                            {currentEvents.map((event, index) => (
                                <div key={index} className="flex items-center p-2 my-1 bg-green-900 bg-opacity-20 rounded">
                                    <div className="text-xl mr-2">{event.type === 'grandma' ? '👵' : '🐢'}</div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{event.name}</div>
                                        <div className="text-xs opacity-80">
                                            Until {event.end.toFormat('HH:mm')}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Next Events */}
                    {nextEvents.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-sm mb-1">Upcoming</h4>
                            {nextEvents.map((event, index) => (
                                <div key={index} className="flex items-center p-2 my-1 bg-gray-900 bg-opacity-20 rounded">
                                    <div className="text-xl mr-2">{event.type === 'grandma' ? '👵' : '🐢'}</div>
                                    <div className="flex-1">
                                        <div className="text-sm font-medium">{event.name}</div>
                                        <div className="text-xs opacity-80">
                                            {event.start.toFormat('HH:mm')} - {event.end.toFormat('HH:mm')}
                                        </div>
                                        <div className="text-xs opacity-60">{event.location}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}