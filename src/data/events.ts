import { DateTime, Duration } from 'luxon';

// Grandma's dinner times (every 2 hours starting at 00:35 CST/Asia/Shanghai)
const grandmaTimes = [
    Duration.fromObject({ hours: 0, minutes: 35 }),
    Duration.fromObject({ hours: 2, minutes: 35 }),
    Duration.fromObject({ hours: 4, minutes: 35 }),
    Duration.fromObject({ hours: 6, minutes: 35 }),
    Duration.fromObject({ hours: 8, minutes: 35 }),
    Duration.fromObject({ hours: 10, minutes: 35 }),
    Duration.fromObject({ hours: 12, minutes: 35 }),
    Duration.fromObject({ hours: 14, minutes: 35 }),
    Duration.fromObject({ hours: 16, minutes: 35 }),
    Duration.fromObject({ hours: 18, minutes: 35 }),
    Duration.fromObject({ hours: 20, minutes: 35 }),
    Duration.fromObject({ hours: 22, minutes: 35 }),
];

// Turtle times (00:50, 08:50, 16:50 CST/Asia/Shanghai)
const turtleTimes = [
    Duration.fromObject({ hours: 0, minutes: 50 }),
    Duration.fromObject({ hours: 8, minutes: 50 }),
    Duration.fromObject({ hours: 16, minutes: 50 }),
];

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
        const end = start.plus({ minutes: 15 }); // Grandma lasts 15 minutes
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
        const end = start.plus({ minutes: 50 }); // Turtle lasts 50 minutes
        return {
            start,
            end,
            type: 'turtle' as const,
            name: 'Turtle',
            location: 'Sanctuary Islands'
        };
    });
}

// Function to get all daily events (grandma + turtle)
export function getDailyEvents(date: DateTime): GameEvent[] {
    const grandmaEvents = getGrandmaEvents(date);
    const turtleEvents = getTurtleEvents(date);

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

    // If no events today, get first event tomorrow
    const tomorrow = from.plus({ days: 1 });
    const tomorrowEvents = getDailyEvents(tomorrow);
    return tomorrowEvents.length > 0 ? tomorrowEvents[0] : null;
}

// Function to get current ongoing events
export function getCurrentEvents(from: DateTime = DateTime.now()): GameEvent[] {
    const events = getDailyEvents(from);
    const now = from.setZone('Asia/Shanghai');

    return events.filter(event => event.start <= now && event.end >= now);
}