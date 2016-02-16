import React from "react";
import DayPicker, { DateUtils } from "react-day-picker-substyled";


export default class DisabledDays extends React.Component {

  state = {
    selectedDay: null
  };

  handleDayClick(e, day, modifiers) {
    if (modifiers.indexOf("disabled") > -1) {
      console.log("User clicked a disabled day.");
      return;
    }
    this.setState({
      selectedDay: day
    });
  }

  render() {

    // Add the `selected` modifier to the cell of the clicked day
    const modifiers = {
      disabled: DateUtils.isPastDay,
      selected: day => DateUtils.isSameDay(this.state.selectedDay, day)
    };

    return <DayPicker enableOutsideDays modifiers={ modifiers } onDayClick={ this.handleDayClick.bind(this) } />;
  }
}
