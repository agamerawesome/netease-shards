import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCog, FaCalendarDay, FaEllipsisV, FaAngleRight, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { DateTime } from 'luxon';
import { DynamicCalendar } from '../../components/Calendar';
import { ClockNow } from '../../components/Clock';
import { useModal } from '../../context/ModalContext';
import { useNow } from '../../context/Now';
import { useSettings } from '../../context/Settings';
import DateSelectionModal from '../Modals/DateSelector';
import SettingsModal from '../Modals/Settings';
import EventsModal from '../Modals/EventsModal';
import { getDailyEvents, getNextEvent, getCurrentEvents } from '../../data/events';

function HeaderDateTime({ navigateToday }: { navigateToday: () => void }) {
  const { application: now } = useNow();
  const { t } = useTranslation('application');
  const dateActive = Math.floor(now.second / 6) % 2 === 0;

  return (
    <div
      data-nosnippet
      onClick={navigateToday}
      className='flex cursor-pointer flex-col flex-nowrap items-center justify-center gap-x-3 text-center md:flex-row landscape:flex-row'
    >
      <p className='max-md:hidden'>{t('headerDateTimeIndicator')}</p>
      <p
        className='short:swap data-[swap="true"]:short:swap-active max-md:swap data-[swap="true"]:max-md:swap-active tall:md:cursor-pointer tall:md:flex-col tall:md:gap-x-2'
        data-swap={dateActive}
      >
        <DynamicCalendar className='swap-on' />
        <span className='swap-off md:hidden'>{t('headerDateTimeIndicator')}</span>
      </p>
      <ClockNow dualUnit className='text-md xs:text-2xl' relFontSize={0} />
    </div>
  );
}

export function HeaderButton({
  children,
  title,
  isExpand = false,
  onClick,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  isExpand?: boolean;
}) {
  return (
    <div
      className='tooltip tooltip-bottom hidden *:transition-all data-[expand=true]:block md:block md:data-[expand=true]:hidden max-md:group-data-[expand-menu=true]:block'
      data-tip={title}
      data-expand={isExpand}
    >
      <button
        type='button'
        title={title}
        className='w-min rounded-lg bg-slate-50 bg-opacity-25 p-1.5 shadow-xl shadow-zinc-700 hover:bg-opacity-50'
        onClick={onClick}
      >
        {children}
      </button>
    </div>
  );
}

function HeaderEventDisplay() {
  const { application } = useNow();
  const [isExpanded, setIsExpanded] = useState(false);

  const dailyEvents = getDailyEvents(application);

  // Filter for current and future events (including next day)
  const currentEvents = getCurrentEvents(application);
  const nextEvents = dailyEvents
    .filter(event => event.start > application)
    .sort((a, b) => a.start.toMillis() - b.start.toMillis())
    .slice(0, 4);

  // Get the very next event (could be today or tomorrow)
  const nextEvent = nextEvents.length > 0 ? nextEvents[0] : null;

  // Format time until next event with next-day awareness
  const formatTimeUntil = (event: any) => {
    const diff = event.start.diff(application);
    const hours = diff.as('hours');
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;

    if (days > 0) {
      // Next day event
      if (remainingHours < 1) {
        return `in ${days}d ${Math.round(remainingHours * 60)}m`;
      } else {
        return `in ${days}d ${Math.round(remainingHours)}h`;
      }
    } else if (hours < 1) {
      // Less than 1 hour: show minutes and seconds
      return `in ${diff.toFormat("mm'm' ss's'")}`;
    } else {
      // 1 hour or more: show hours and minutes
      return `in ${diff.toFormat("h'h' mm'm'")}`;
    }
  };

  // Format event time display with day indicator
  const formatEventTime = (event: any) => {
    const isTomorrow = event.start.hasSame(application.plus({ days: 1 }), 'day');
    const timeStr = event.start.toFormat('HH:mm');

    return isTomorrow ? `Tomorrow ${timeStr}` : timeStr;
  };

  if (dailyEvents.length === 0) {
    return null;
  }

  return (
    <div className="relative">
      {/* Compact event display */}
      <div
        className="flex items-center cursor-pointer px-2 py-1 rounded hover:bg-white hover:bg-opacity-10 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {currentEvents.length > 0 ? (
          <div className="flex items-center">
            <span className="text-sm mr-1">{currentEvents[0].type === 'grandma' ? '👵' : '🐢'}</span>
            <span className="text-xs">Now: {currentEvents[0].name}</span>
          </div>
        ) : nextEvent ? (
          <div className="flex items-center">
            <span className="text-sm mr-1">{nextEvent.type === 'grandma' ? '👵' : '🐢'}</span>
            <span className="text-xs">Next: {formatTimeUntil(nextEvent)}</span>
          </div>
        ) : (
          <span className="text-xs opacity-70">No upcoming events</span>
        )}
        <span className="ml-1 text-xs">
          {isExpanded ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
        </span>
      </div>

      {/* Expanded event panel */}
      {isExpanded && (
        <div className="absolute top-full right-0 mt-1 w-80 glass rounded shadow-lg z-10 p-3">
          {/* Current Events */}
          {currentEvents.length > 0 && (
            <div className="mb-3">
              <h4 className="font-semibold text-green-300 text-sm mb-2">Happening Now</h4>
              {currentEvents.map((event, index) => (
                <EventProgressBar key={index} event={event} currentTime={application} />
              ))}
            </div>
          )}

          {/* Upcoming Events - Two columns */}
          {nextEvents.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {/* Turtle Events */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Turtle 🐢</h4>
                {nextEvents
                  .filter(event => event.type === 'turtle')
                  .slice(0, 2)
                  .map((event, index) => (
                    <EventProgressBar
                      key={index}
                      event={event}
                      currentTime={application}
                      formatTime={formatEventTime}
                    />
                  ))}
              </div>

              {/* Grandma Events */}
              <div>
                <h4 className="font-semibold text-sm mb-2">Grandma 👵</h4>
                {nextEvents
                  .filter(event => event.type === 'grandma')
                  .slice(0, 2)
                  .map((event, index) => (
                    <EventProgressBar
                      key={index}
                      event={event}
                      currentTime={application}
                      formatTime={formatEventTime}
                    />
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Updated Event Progress Bar Component
function EventProgressBar({ event, currentTime, formatTime }: { event: any, currentTime: any, formatTime?: (event: any) => string }) {
  const isCurrent = currentTime >= event.start && currentTime <= event.end;
  const isFuture = currentTime < event.start;

  // Calculate progress percentage for current events
  let progress = 0;
  if (isCurrent) {
    const totalDuration = event.end.diff(event.start).as('milliseconds');
    const elapsed = currentTime.diff(event.start).as('milliseconds');
    progress = (elapsed / totalDuration) * 100;
  }

  // Format time display with day awareness
  const formatTimeDisplay = () => {
    if (isCurrent) {
      const minutesLeft = Math.round(event.end.diff(currentTime).as('minutes'));
      return `Ends in ${minutesLeft}m`;
    } else {
      const hoursUntil = event.start.diff(currentTime).as('hours');
      const days = Math.floor(hoursUntil / 24);
      const remainingHours = hoursUntil % 24;

      if (days > 0) {
        return `in ${days}d ${Math.round(remainingHours)}h`;
      } else if (hoursUntil < 1) {
        return `in ${Math.round(hoursUntil * 60)}m`;
      } else {
        return `in ${Math.round(hoursUntil)}h`;
      }
    }
  };

  return (
    <div className={`mb-2 p-2 rounded ${isCurrent ? 'bg-green-900 bg-opacity-20' : 'bg-gray-900 bg-opacity-10'}`}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium">{event.name}</span>
        <span className="text-xs opacity-80">
          {formatTime ? formatTime(event) : event.start.toFormat('HH:mm')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 bg-opacity-30 rounded-full h-1.5 mb-1">
        <div
          className={`h-1.5 rounded-full ${isCurrent ? 'bg-green-500' : 'bg-blue-500'}`}
          style={{ width: `${isCurrent ? progress : 0}%` }}
        ></div>
      </div>

      {/* Status Text */}
      <div className="text-xs opacity-70">
        {formatTimeDisplay()}
      </div>
    </div>
  );
}

export default function Header() {
  const { t } = useTranslation(['application', 'dateSelector', 'settings', 'events']);
  const { setSettings } = useSettings();
  const { showModal } = useModal();
  const { application } = useNow();
  const navigateToday = () => setSettings({ date: DateTime.local({ zone: 'Asia/Shanghai' }) });
  const [expandMenu, setExpandMenu] = useState(false);

  const currentEvents = getCurrentEvents(application);
  const nextEvent = getNextEvent(application);

  return (
    <header
      className='group glass flex max-h-min flex-row flex-nowrap items-center justify-between px-4'
      data-expand-menu={expandMenu}
    >
      <a
        className='max-md:group-data-[expand-menu=true]:hidden'
        href='/'
        onClick={e => (navigateToday(), e.preventDefault())}
      >
        <img src='/icons/appName.webp' alt='NetEase Shards' className='h-7 w-auto md:h-10' />
      </a>

      <HeaderDateTime navigateToday={navigateToday} />

      <div className='flex flex-row gap-x-2'>
        {/* Events Button */}
        <HeaderButton
          title={t('events:title')}
          onClick={() => {
            showModal({
              children: EventsModal,
              hideOnOverlayClick: true,
              title: t('events:title'),
            });
          }}
        >
          <div className="flex items-center">
            {currentEvents.length > 0 ? (
              <>
                <span className="text-sm mr-1">{currentEvents[0].type === 'grandma' ? '👵' : '🐢'}</span>
                <span className="text-xs">Now</span>
              </>
            ) : nextEvent ? (
              <>
                <span className="text-sm mr-1">{nextEvent.type === 'grandma' ? '👵' : '🐢'}</span>
                <span className="text-xs">Next</span>
              </>
            ) : (
              <span className="text-xs">Events</span>
            )}
          </div>
        </HeaderButton>

        <HeaderButton
          title={t('dateSelector:title')}
          onClick={() => {
            showModal({
              children: DateSelectionModal,
              hideOnOverlayClick: true,
              title: t('dateSelector:title'),
            });
          }}
        >
          <FaCalendarDay size={18} />
        </HeaderButton>
        <HeaderButton
          title={t('settings:title')}
          onClick={() => {
            showModal({
              children: SettingsModal,
              hideOnOverlayClick: true,
              title: t('settings:title'),
            });
          }}
        >
          <FaCog size={18} />
        </HeaderButton>
        <HeaderButton isExpand title='Expand' onClick={() => setExpandMenu(!expandMenu)}>
          {expandMenu ? <FaAngleRight size={18} /> : <FaEllipsisV size={18} />}
        </HeaderButton>
      </div>
    </header>
  );
}