import React from "react";
import DayPicker from "react-day-picker-substyled";

export default function SimpleCalendar() {
  return <DayPicker onDayClick={ (e, day) => alert(day) } />;
}
