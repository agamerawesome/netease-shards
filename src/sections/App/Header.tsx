import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCog, FaCalendarDay, FaEllipsisV, FaAngleRight } from 'react-icons/fa';
import { DateTime } from 'luxon';
import { DynamicCalendar } from '../../components/Calendar';
import { ClockNow } from '../../components/Clock';
import { useModal } from '../../context/ModalContext';
import { useNow } from '../../context/Now';
import { useSettings } from '../../context/Settings';
import { getDailyEvents, getCurrentEvents, getGrandmaEvents, GameEvent } from '../../data/events';
import DateSelectionModal from '../Modals/DateSelector';
import SettingsModal from '../Modals/Settings';

function fmtUntil(event: GameEvent, from: DateTime): string {
  const totalMins = event.start.diff(from).as('minutes');
  if (totalMins < 1) return '<1m';
  const h = Math.floor(totalMins / 60);
  const m = Math.round(totalMins % 60);
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function progressOf(event: GameEvent, now: DateTime): number {
  const total = event.end.diff(event.start).as('milliseconds');
  const elapsed = now.diff(event.start).as('milliseconds');
  return Math.min(100, Math.max(0, (elapsed / total) * 100));
}

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

// ─── Desktop: clickable chips (same popup as mobile) ─────────────────────────

function DesktopEventChip({
  type,
  application,
}: {
  type: 'grandma' | 'turtle';
  application: DateTime;
}) {
  const { t } = useTranslation('events');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [open]);

  const currentEvents = getCurrentEvents(application);
  const current = currentEvents.find(e => e.type === type) ?? null;
  const next = getDailyEvents(application)
    .filter(e => e.type === type && e.start > application)
    .sort((a, b) => a.start.toMillis() - b.start.toMillis())[0] ?? null;

  const isActive = !!current;
  const emoji = type === 'grandma' ? '👵' : '🐢';
  const name = type === 'grandma' ? t('grandmaName') : t('turtleName');

  return (
    <div ref={ref} className='relative'>
      <button
        type='button'
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 rounded-lg px-2 py-1 transition-colors ${
          isActive
            ? 'bg-green-500 bg-opacity-25 ring-1 ring-green-400 ring-opacity-50'
            : open
            ? 'bg-white bg-opacity-20'
            : 'bg-white bg-opacity-10 hover:bg-opacity-15'
        }`}
      >
        <span className='text-base leading-none'>{emoji}</span>
        <div className='flex flex-col leading-tight text-left'>
          <span className='text-xs font-semibold'>{name}</span>
          <span className={`text-xs ${isActive ? 'text-green-300' : 'opacity-60'}`}>
            {isActive ? t('statusNow') : next ? fmtUntil(next, application) : '--'}
          </span>
        </div>
      </button>
      {open && (
        <div className='absolute right-0 top-full z-30 mt-2 w-56'>
          <MobileEventPopup type={type} application={application} />
        </div>
      )}
    </div>
  );
}

function DailyEventsDisplay() {
  const { application } = useNow();
  return (
    <div className='flex gap-1.5'>
      <DesktopEventChip type='grandma' application={application} />
      <DesktopEventChip type='turtle' application={application} />
    </div>
  );
}

// ─── Mobile: chips row with progress bars + click-to-popup ───────────────────

function MobileEventPopup({
  type,
  application,
}: {
  type: 'grandma' | 'turtle';
  application: DateTime;
}) {
  const { t } = useTranslation('events');
  const currentEvents = getCurrentEvents(application);
  const current = currentEvents.find(e => e.type === type) ?? null;
  const endsIn = current ? Math.round(current.end.diff(application).as('minutes')) : 0;

  if (type === 'grandma') {
    const todayEvents = getGrandmaEvents(application);
    return (
      <div className='rounded-xl border border-white border-opacity-10 bg-slate-900 bg-opacity-95 p-3 shadow-2xl backdrop-blur'>
        <h4 className='mb-2.5 flex items-center gap-1.5 text-sm font-bold'>
          <span>👵</span>
          <span>{t('grandmaName')} · {t('labelToday')}</span>
          <span className='ml-auto text-xs font-normal opacity-40'>{t('grandmaDuration')} · {t('grandmaLocation')}</span>
        </h4>
        {current && (
          <div className='mb-2 flex items-center gap-2 rounded-lg bg-green-500 bg-opacity-20 px-2 py-1.5 text-xs text-green-300'>
            <span>{t('happeningNow')}</span>
            <span className='ml-auto opacity-80'>{t('endsIn', { min: endsIn })}</span>
          </div>
        )}
        <div className='space-y-1'>
          {todayEvents.map((event, i) => {
            const isPast = event.end < application;
            const isNow = !isPast && event.start <= application;
            const prog = isNow ? progressOf(event, application) : 0;
            return (
              <div
                key={i}
                className={`rounded-lg px-2 py-1.5 text-xs ${
                  isNow ? 'bg-green-500 bg-opacity-20' : isPast ? 'opacity-25' : 'bg-white bg-opacity-5'
                }`}
              >
                <div className='flex items-center justify-between'>
                  <span className='font-mono tabular-nums'>{event.start.toFormat('HH:mm')}</span>
                  <span className={isNow ? 'text-green-300' : 'opacity-60'}>
                    {isNow ? t('statusNow') : isPast ? t('statusDone') : fmtUntil(event, application)}
                  </span>
                </div>
                {isNow && (
                  <div className='mt-1.5 h-1 w-full rounded-full bg-white bg-opacity-15'>
                    <div className='h-1 rounded-full bg-green-400' style={{ width: `${prog}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Turtle: next 5 future + current banner
  const nextTurtle = getDailyEvents(application)
    .filter(e => e.type === 'turtle' && e.start > application)
    .sort((a, b) => a.start.toMillis() - b.start.toMillis())
    .slice(0, 5);

  return (
    <div className='rounded-xl border border-white border-opacity-10 bg-slate-900 bg-opacity-95 p-3 shadow-2xl backdrop-blur'>
      <h4 className='mb-2.5 flex items-center gap-1.5 text-sm font-bold'>
        <span>🐢</span>
        <span>{t('turtleName')} · {t('labelNextFive')}</span>
        <span className='ml-auto text-xs font-normal opacity-40'>{t('turtleDuration')} · {t('turtleLocation')}</span>
      </h4>
      {current && (
        <div className='mb-2 rounded-lg bg-green-500 bg-opacity-20 px-2 py-1.5 text-xs text-green-300'>
          <div className='mb-1.5 flex items-center justify-between'>
            <span>{t('happeningNow')}</span>
            <span className='opacity-80'>{t('endsIn', { min: endsIn })}</span>
          </div>
          <div className='h-1 w-full rounded-full bg-white bg-opacity-15'>
            <div
              className='h-1 rounded-full bg-green-400'
              style={{ width: `${progressOf(current, application)}%` }}
            />
          </div>
        </div>
      )}
      <div className='space-y-1'>
        {nextTurtle.map((event, i) => (
          <div key={i} className='flex items-center justify-between rounded-lg bg-white bg-opacity-5 px-2 py-1.5 text-xs'>
            <span className='font-mono tabular-nums'>{event.start.toFormat('HH:mm')}</span>
            <span className='opacity-60'>{fmtUntil(event, application)}</span>
          </div>
        ))}
        {nextTurtle.length === 0 && (
          <p className='py-1 text-center text-xs opacity-40'>{t('noMoreToday')}</p>
        )}
      </div>
    </div>
  );
}

function MobileEventsRow() {
  const { application } = useNow();
  const { t } = useTranslation('events');
  const [activePopup, setActivePopup] = useState<'grandma' | 'turtle' | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!activePopup) return;
    const handle = (e: MouseEvent) => {
      if (rowRef.current && !rowRef.current.contains(e.target as Node)) setActivePopup(null);
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [activePopup]);

  const currentEvents = getCurrentEvents(application);
  const futureEvents = getDailyEvents(application)
    .filter(e => e.start > application)
    .sort((a, b) => a.start.toMillis() - b.start.toMillis());

  const chips = [
    {
      type: 'grandma' as const,
      emoji: '👵',
      label: t('grandmaName'),
      current: currentEvents.find(e => e.type === 'grandma') ?? null,
      next: futureEvents.find(e => e.type === 'grandma') ?? null,
    },
    {
      type: 'turtle' as const,
      emoji: '🐢',
      label: t('turtleName'),
      current: currentEvents.find(e => e.type === 'turtle') ?? null,
      next: futureEvents.find(e => e.type === 'turtle') ?? null,
    },
  ];

  return (
    <div ref={rowRef} className='relative flex gap-2 pb-1.5 md:hidden'>
      {chips.map(({ type, emoji, label, current, next }) => {
        const isActive = !!current;
        const isOpen = activePopup === type;
        const prog = current ? progressOf(current, application) : 0;
        const endsIn = current ? Math.round(current.end.diff(application).as('minutes')) : 0;

        return (
          <button
            key={type}
            type='button'
            onClick={() => setActivePopup(p => (p === type ? null : type))}
            className={`flex flex-1 flex-col rounded-lg px-3 py-1.5 text-left transition-all ${
              isActive
                ? 'bg-green-500 bg-opacity-20 ring-1 ring-green-400 ring-opacity-50'
                : isOpen
                ? 'bg-white bg-opacity-20'
                : 'bg-white bg-opacity-10 hover:bg-opacity-15'
            }`}
          >
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-1.5'>
                <span className='text-sm leading-none'>{emoji}</span>
                <span className='text-xs font-semibold'>{label}</span>
              </div>
              <span className={`text-xs ${isActive ? 'text-green-300' : 'opacity-60'}`}>
                {isActive ? t('endsIn', { min: endsIn }) : next ? fmtUntil(next, application) : '--'}
              </span>
            </div>
            {/* Bar: always visible, filled + green when active */}
            <div className='mt-1.5 h-1 w-full rounded-full bg-white bg-opacity-10'>
              <div
                className={`h-1 rounded-full transition-all duration-1000 ${isActive ? 'bg-green-400' : 'bg-transparent'}`}
                style={{ width: `${prog}%` }}
              />
            </div>
          </button>
        );
      })}

      {/* Full-width popup anchored below the chip row */}
      {activePopup && (
        <div className='absolute left-0 right-0 top-full z-30 mt-1'>
          <MobileEventPopup type={activePopup} application={application} />
        </div>
      )}
    </div>
  );
}

// ─── Root header ─────────────────────────────────────────────────────────────

export default function Header() {
  const { t } = useTranslation(['application', 'dateSelector', 'settings']);
  const { setSettings } = useSettings();
  const { showModal } = useModal();
  const navigateToday = () => setSettings({ date: DateTime.local({ zone: 'Asia/Shanghai' }) });
  const [expandMenu, setExpandMenu] = useState(false);

  return (
    <header
      className='group glass max-h-min flex flex-col px-4'
      data-expand-menu={expandMenu}
    >
      {/* ── Main nav row (logo · datetime · buttons) ── */}
      <div className='flex flex-row flex-nowrap items-center justify-between'>
        <a
          className='max-md:group-data-[expand-menu=true]:hidden'
          href='/'
          onClick={e => (navigateToday(), e.preventDefault())}
        >
          <img src='/icons/appName1.png' alt='NetEase Shards' className='h-7 w-auto md:h-10' />
        </a>

        <HeaderDateTime navigateToday={navigateToday} />

        <div className='flex flex-row items-center gap-x-2'>
          {/* Desktop-only inline event display */}
          <div className='hidden md:flex'>
            <DailyEventsDisplay />
          </div>

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
      </div>

      {/* ── Mobile-only: Grandma + Turtle chips ── */}
      <MobileEventsRow />
    </header>
  );
}
