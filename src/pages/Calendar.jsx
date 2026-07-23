import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import elLocale from "@fullcalendar/core/locales/el";
import { translate } from "../contexts/LanguageContext";

export default function Calendar({
  language,
  events,
  profile,
  isAdmin,
  setSelectedDate,
  setSelectedClasses,
  setNewHW,
  setShowAddModal,
  setSelectedEvent,
  setShowViewModal,
}) {
  return (
    <div className="calendar-card">
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        locale={language === "el" ? elLocale : undefined}
        buttonText={{
          today: translate("Today"),
          month: language === "el" ? "Μήνας" : "Month",
          week: language === "el" ? "Εβδομάδα" : "Week",
          day: language === "el" ? "Ημέρα" : "Day",
        }}
        events={events}
        dateClick={(argument) => {
          if (
            (profile?.role === "teacher" || isAdmin) &&
            profile?.is_approved
          ) {
            setSelectedDate(argument.dateStr);
            setSelectedClasses([]);
            setNewHW({ title: "", subject: "", className: "" });
            setShowAddModal(true);
          }
        }}
        eventClick={(information) => {
          setSelectedEvent({
            id: information.event.id,
            ...information.event.extendedProps,
            date: information.event.startStr,
          });
          setShowViewModal(true);
        }}
      />
    </div>
  );
}
