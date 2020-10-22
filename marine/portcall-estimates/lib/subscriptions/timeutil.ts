import moment from 'moment-timezone';

function isAfter(now: Date, hours: number, minutes: number) {
    return hours > now.getHours() || (hours == now.getHours() && minutes > now.getMinutes());
}

// convert time from subscription(HHMM) to date for searching estimates
// handle date as follows:
// time     current_time    return value
// 0700     5.5 08:00       5.5 07:00
// 0700     5.5 06:00       4.5 07:00
export function getStartTime(time: string): Date {
    const now = new Date();
    const hours = +time.substring(0, 2);
    const minutes = +time.substring(2);

    const startTime = moment(now).hours(hours).minutes(minutes).seconds(0).tz('Europe/Helsinki') as moment.Moment;

    if(isAfter(now, hours, minutes)) {
        startTime.subtract(1, 'days');
    }

    return startTime.toDate();
}