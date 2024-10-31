import { formatDisplayUsdt } from 'pages/Pools/helpers';
import { MONTHS_ARR, TIMER } from '../constants';

export const formatCountdownTime = (milliseconds: number) => {
  const formatMilliseconds = milliseconds < 0 ? 0 : milliseconds;
  const seconds = Math.floor(formatMilliseconds / TIMER.MILLISECOND);
  const minutes = Math.floor(seconds / TIMER.SECOND);
  const hours = Math.floor(minutes / TIMER.MINUTE);
  const days = Math.floor(hours / TIMER.HOUR);

  const remainingHours = hours % TIMER.HOUR;
  const remainingMinutes = minutes % TIMER.MINUTE;
  const remainingSeconds = seconds % TIMER.SECOND;

  return {
    days: String(days).padStart(2, '0'),
    hours: String(remainingHours).padStart(2, '0'),
    minutes: String(remainingMinutes).padStart(2, '0'),
    seconds: String(remainingSeconds).padStart(2, '0')
  };
};

export const calcDiffTime = (start: string | Date | number, end: string | Date | number) => {
  return new Date(end).getTime() - new Date(start).getTime();
};

export const calcPercent = (start: number, end: number, current: number) => {
  const total = new Date(end * TIMER.MILLISECOND).getTime() - new Date(start * TIMER.MILLISECOND).getTime();

  if (current <= 0) return 100;
  return total > 0 ? 100 - (current * 100) / total : 100;
};

export function dateFormat(date) {
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date);

  const [month, day, year, time] = formattedDate.split(' ');

  return `${MONTHS_ARR[MONTHS_ARR.indexOf(month)]} ${day} ${year} ${time}`;
}

export const formatUTCDateString = (date) => {
  // Get the current date and time
  const currentDate = new Date(date);

  // Format the date to a string
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    timeZoneName: 'longOffset'
  }).format(currentDate);

  // Extract UTC offset
  const utcOffset = Intl.DateTimeFormat('en-US', { timeZoneName: 'longOffset' })
    .formatToParts(currentDate)
    .find((part) => part.type === 'timeZoneName').value;

  // Combine the formatted date and UTC offset
  const result = `${formattedDate}`;

  return result;
};

export const dateFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'short',
  day: '2-digit'
});

export const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h24'
});

export const timeWithPeriodFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

export const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  year: '2-digit',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
});

// extend formatToJson
Intl.DateTimeFormat.prototype.formatToJson = function (date: Date | number) {
  const _this = this as Intl.DateTimeFormat;
  return Object.fromEntries(
    _this
      .formatToParts(typeof date === 'number' && date < 1000000000000 ? date * 1000 : date)
      .filter((item) => item.type !== 'literal')
      .map((item) => [item.type, item.value])
  ) as Record<Intl.DateTimeFormatPartTypes, string>;
};

export function formatDate(date: Date | number) {
  const obj = dateFormatter.formatToJson(date);
  return `${obj.month} ${obj.day}, ${obj.year}`;
}

export function formatDateV2(date: Date | number) {
  const obj = dateTimeFormatter.formatToJson(date);
  return `${obj.day}/${obj.month}/${obj.year}`;
}

export function formatDateChart(date: Date | number) {
  const obj = dateFormatter.formatToJson(date);
  return `${obj.day} ${obj.month}`;
}

export function formatTime(date: Date | number) {
  const obj = timeFormatter.formatToJson(date);

  // check case 24h
  if (obj.hour === '24') {
    obj.hour = '00';
  }

  return `${obj.hour}:${obj.minute}`; // ${obj.dayPeriod} //:${obj.second}
}

export function formatTimeWithPeriod(date: Date | number) {
  const obj = timeWithPeriodFormatter.formatToJson(date);
  return `${obj.hour}:${obj.minute} ${obj.dayPeriod}`; //:${obj.second}
}

export const getUTCTime = (date: Date | number) => {
  const currentDate = new Date(date);
  const utcHours = String(currentDate.getUTCHours()).padStart(2, '0');

  const utcMinutes = String(currentDate.getUTCMinutes()).padStart(2, '0');

  const utcSeconds = String(currentDate.getUTCSeconds()).padStart(2, '0');

  return `${utcHours}:${utcMinutes}:${utcSeconds}`;
};

export const formatNumberKMB = (num: number) => {
  if (num >= 1e9) {
    return '$' + (num / 1e9).toFixed(2) + 'B';
  }

  if (num >= 1e6) {
    return '$' + (num / 1e6).toFixed(2) + 'M';
  }

  if (num >= 1e3) {
    return '$' + (num / 1e3).toFixed(2) + 'K';
  }
  return formatDisplayUsdt(num, 2);
};

export const checkTimeIsMillisecond = (timestamp: number) => {
  if (Math.abs(Date.now() - timestamp) < Math.abs(Date.now() - timestamp * 1000)) {
    return true;
  }
  return false;
};
