import { useEffect } from 'react';

export const useDispatchEvent = (eventType: string, eventData: any) => {
  useEffect(() => {
    const event = new CustomEvent(eventType, { detail: eventData });
    window.dispatchEvent(event);
  }, [eventData]); // eventData, eventType
};
