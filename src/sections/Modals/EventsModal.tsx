import { useTranslation } from 'react-i18next';
import { ModalProps } from '../../context/ModalContext';
import { useNow } from '../../context/Now';
import { getDailyEvents, getCurrentEvents, getUpcomingEvents } from '../../data/events';

export default function EventsModal({ hideModal }: ModalProps) {
    const { t } = useTranslation('events');
    const { application } = useNow();

    const currentEvents = getCurrentEvents(application);
    const upcomingEvents = getUpcomingEvents(application, 10);

    // Separate upcoming events by type
    const upcomingTurtle = upcomingEvents.filter(event => event.type === 'turtle');
    const upcomingGrandma = upcomingEvents.filter(event => event.type === 'grandma');

    return (
        <div className="max-h-[70vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-center">{t('title')}</h2>

            {/* Current Events */}
            {currentEvents.length > 0 && (
                <div className="mb-6">
                    <h3 className="font-semibold text-green-300 mb-3">{t('currentEvents')}</h3>
                    <div className="space-y-3">
                        {currentEvents.map((event, index) => (
                            <EventCard key={index} event={event} currentTime={application} isCurrent={true} />
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Events */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Turtle Events */}
                <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                        <span className="text-2xl mr-2">🐢</span>
                        {t('turtleEvents')}
                    </h3>
                    {upcomingTurtle.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingTurtle.map((event, index) => (
                                <EventCard key={index} event={event} currentTime={application} isCurrent={false} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm opacity-70 italic">{t('noTurtleEvents')}</p>
                    )}
                </div>

                {/* Grandma Events */}
                <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                        <span className="text-2xl mr-2">👵</span>
                        {t('grandmaEvents')}
                    </h3>
                    {upcomingGrandma.length > 0 ? (
                        <div className="space-y-3">
                            {upcomingGrandma.map((event, index) => (
                                <EventCard key={index} event={event} currentTime={application} isCurrent={false} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm opacity-70 italic">{t('noGrandmaEvents')}</p>
                    )}
                </div>
            </div>
        </div>
    );
}

// Event Card Component
function EventCard({ event, currentTime, isCurrent }: { event: any, currentTime: any, isCurrent: boolean }) {
    const { t } = useTranslation('events');
    const eventName = event.type === 'grandma' ? t('grandmaName') : t('turtleName');
    const eventLocation = event.type === 'grandma' ? t('grandmaLocation') : t('turtleLocation');

    const formatTimeUntil = () => {
        if (isCurrent) {
            const minutesLeft = Math.round(event.end.diff(currentTime).as('minutes'));
            return `${minutesLeft}m left`;
        } else {
            const hoursUntil = event.start.diff(currentTime).as('hours');
            if (hoursUntil < 1) {
                return `in ${Math.round(hoursUntil * 60)}m`;
            } else if (hoursUntil < 24) {
                return `in ${Math.round(hoursUntil)}h`;
            } else {
                const days = Math.floor(hoursUntil / 24);
                const hours = Math.round(hoursUntil % 24);
                return `in ${days}d ${hours}h`;
            }
        }
    };

    const isTomorrow = !event.start.hasSame(currentTime, 'day');
    const timeDisplay = isTomorrow ? `Tomorrow ${event.start.toFormat('HH:mm')}` : event.start.toFormat('HH:mm');

    return (
        <div className={`p-3 rounded-lg ${isCurrent ? 'bg-green-900 bg-opacity-30 border border-green-500' : 'bg-gray-900 bg-opacity-20'}`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                    <h4 className="font-medium">{eventName}</h4>
                    <p className="text-sm opacity-80">{eventLocation}</p>
                </div>
                <span className="text-2xl">{event.type === 'grandma' ? '👵' : '🐢'}</span>
            </div>

            <div className="flex justify-between items-center text-sm">
                <span className="opacity-80">{timeDisplay}</span>
                <span className={isCurrent ? 'text-green-400' : 'text-blue-400'}>
                    {formatTimeUntil()}
                </span>
            </div>

            {isCurrent && (
                <div className="mt-2 w-full bg-gray-700 bg-opacity-30 rounded-full h-2">
                    <div
                        className="h-2 rounded-full bg-green-500"
                        style={{
                            width: `${(currentTime.diff(event.start).as('milliseconds') / event.end.diff(event.start).as('milliseconds')) * 100}%`
                        }}
                    ></div>
                </div>
            )}
        </div>
    );
}