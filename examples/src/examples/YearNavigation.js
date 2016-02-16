import React from "react";
import DayPicker from "react-day-picker-substyled";


const currentYear = (new Date()).getFullYear();
const fromMonth = new Date(currentYear, 0, 1, 0, 0);
const toMonth = new Date(currentYear + 10, 11, 31, 23, 59);

function YearMonthForm({ date, localeUtils, onChange }) {

  const months = localeUtils.getMonths();

  const years = [];
  for (let i = fromMonth.getFullYear(); i <= toMonth.getFullYear(); i++) {
    years.push(i);
  }

  const handleChange = function(e) {
    const { year, month } = e.target.form;
    onChange(new Date(year.value, month.value));
  }

  const selectStyle = {
    border: 0,
    width: 'auto',
    marginTop: '-.35rem'
  }

  return (
    <form>
      <select name="month" onChange={ handleChange } value={ date.getMonth() } style={selectStyle}>
        { months.map((month, i) =>
          <option key={ i } value={ i }>
            { month }
          </option>)
        }
      </select>
      <select name="year" onChange={ handleChange } value={ date.getFullYear() } style={selectStyle}>
        { years.map((year, i) =>
          <option key={ i } value={ year }>
            { year }
          </option>)
        }
      </select>
    </form>
  )
}

export default class YearNavigation extends React.Component {

  state = {
    initialMonth: fromMonth
  };

  render() {
    return (
      <div>
        <DayPicker className="dp"
          initialMonth={ this.state.initialMonth }
          fromMonth={ fromMonth }
          toMonth={ toMonth }
          captionElement={
            <YearMonthForm onChange={ initialMonth => this.setState({ initialMonth }) } />
          }
        />
      </div>
    );
  }

}
