import React from "react";
import DayPicker, { DateUtils } from "react-day-picker";

import defaultStyle from "react-day-picker/lib/defaultStyle";

const selectedDayStyle = {
  color: '#FFF',
  backgroundColor: '#4A90E2',
};

const style = {
  ...defaultStyle,
  day: {
    ...defaultStyle.day,
    '&selected': selectedDayStyle
  },
};

export default class SelectableDay extends React.Component {

  state = {
    selectedDay: null
  };

  handleDayClick(e, day, modifiers) {
    this.setState({
      selectedDay: modifiers.indexOf("selected") > -1 ? null : day
    });
  }

  render() {
    const { selectedDay } = this.state;

    return (
      <div>
        <DayPicker
          modifiers={{
            selected: (day, {isToday, isOutside}) => !isOutside && DateUtils.isSameDay(selectedDay, day)
          }}
          onDayClick={ this.handleDayClick.bind(this) }
          style={style} className="as"
        />
        <p>
          Selected: { selectedDay && selectedDay.toLocaleDateString() }
        </p>
      </div>
    );
  }
}
