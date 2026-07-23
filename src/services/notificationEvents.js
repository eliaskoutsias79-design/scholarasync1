export const NOTIFICATION_EVENTS = Object.freeze({
  MESSAGE_CREATED: "message.created",
  ANNOUNCEMENT_CREATED: "announcement.created",
  GRADE_CREATED: "grade.created",
  CALENDAR_REMINDER: "calendar.reminder",
  STUDY_GROUP_ACTIVITY: "study-group.activity",
});

const listeners = new Map();

export const notificationEvents = {
  subscribe(type, listener) {
    const typeListeners = listeners.get(type) || new Set();
    typeListeners.add(listener);
    listeners.set(type, typeListeners);
    return () => typeListeners.delete(listener);
  },

  publish(type, payload) {
    const event = {
      type,
      payload,
      occurredAt: new Date().toISOString(),
    };
    (listeners.get(type) || []).forEach((listener) => listener(event));
    return event;
  },
};
