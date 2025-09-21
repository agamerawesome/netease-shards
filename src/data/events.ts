import { DateTime, Duration } from 'luxon';

// Grandma's dinner times (every 2 hours starting at 00:35 CST/Asia/Shanghai)
const grandmaTimes = [
    //Duration.fromObject({ hours: 0, minutes: 0 }),
    Duration.fromObject({ hours: 8, minutes: 0 }),
    Duration.fromObject({ hours: 10, minutes: 0 }),
    Duration.fromObject({ hours: 12, minutes: 0 }),
    //Duration.fromObject({ hours: 14, minutes: 0 }),
    Duration.fromObject({ hours: 16, minutes: 0 }),
    Duration.fromObject({ hours: 18, minutes: 0 }),
    Duration.fromObject({ hours: 20, minutes: 0 }),
    Duration.fromObject({ hours: 22, minutes: 0 }),
];

// Generate turtle times every 30 minutes from 00:00 to 23:30
function generateTurtleTimes(): Duration[] {
    const times: Duration[] = [];

    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            times.push(Duration.fromObject({ hours: hour, minutes: minute }));
        }
    }

    return times;
}

const turtleTimes = generateTurtleTimes();

export interface GameEvent {
    start: DateTime;
    end: DateTime;
    type: 'grandma' | 'turtle';
    name: string;
    location: string;
}

// Function to get Grandma's events for a day
export function getGrandmaEvents(date: DateTime): GameEvent[] {
    const dayStart = date.setZone('Asia/Shanghai').startOf('day');
    return grandmaTimes.map(time => {
        const start = dayStart.plus(time);
        const end = start.plus({ minutes: 30 }); // Grandma lasts 30 minutes
        return {
            start,
            end,
            type: 'grandma' as const,
            name: 'Grandma\'s Dinner',
            location: 'Hidden Forest, Sunny Forest'
        };
    });
}

// Function to get Turtle events for a day
export function getTurtleEvents(date: DateTime): GameEvent[] {
    const dayStart = date.setZone('Asia/Shanghai').startOf('day');
    return turtleTimes.map(time => {
        const start = dayStart.plus(time);
        const end = start.plus({ minutes: 20 }); // Turtle lasts 20 minutes
        return {
            start,
            end,
            type: 'turtle' as const,
            name: 'Turtle',
            location: 'Sanctuary Islands'
        };
    });
}

// Function to get all daily events (today + tomorrow)
export function getDailyEvents(date: DateTime): GameEvent[] {
    const today = date.setZone('Asia/Shanghai').startOf('day');
    const tomorrow = today.plus({ days: 1 });

    const todayEvents = getEventsForDay(today);
    const tomorrowEvents = getEventsForDay(tomorrow);

    return [...todayEvents, ...tomorrowEvents];
}

// Function to get events for a specific day
function getEventsForDay(date: DateTime): GameEvent[] {
    const dayStart = date.setZone('Asia/Shanghai').startOf('day');

    const grandmaEvents = grandmaTimes.map(time => {
        const start = dayStart.plus(time);
        const end = start.plus({ minutes: 30 });
        return {
            start,
            end,
            type: 'grandma' as const,
            name: 'Grandma\'s Dinner',
            location: 'Hidden Forest, Sunny Forest'
        };
    });

    const turtleEvents = turtleTimes.map(time => {
        const start = dayStart.plus(time);
        const end = start.plus({ minutes: 20 });
        return {
            start,
            end,
            type: 'turtle' as const,
            name: 'Turtle',
            location: 'Sanctuary Islands'
        };
    });

    return [...grandmaEvents, ...turtleEvents].sort((a, b) =>
        a.start.toMillis() - b.start.toMillis()
    );
}

// Function to get next upcoming event
export function getNextEvent(from: DateTime = DateTime.now()): GameEvent | null {
    const events = getDailyEvents(from);
    const now = from.setZone('Asia/Shanghai');

    // Find the first event that hasn't ended yet
    for (const event of events) {
        if (event.end > now) {
            return event;
        }
    }

    return null;
}

// Function to get current ongoing events
export function getCurrentEvents(from: DateTime = DateTime.now()): GameEvent[] {
    const events = getDailyEvents(from);
    const now = from.setZone('Asia/Shanghai');

    return events.filter(event => event.start <= now && event.end >= now);
}

// Function to get upcoming events (future events only)
export function getUpcomingEvents(from: DateTime = DateTime.now(), limit: number = 10): GameEvent[] {
    const events = getDailyEvents(from);
    const now = from.setZone('Asia/Shanghai');

    return events
        .filter(event => event.start > now)
        .sort((a, b) => a.start.toMillis() - b.start.toMillis())
        .slice(0, limit);
}