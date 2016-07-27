import React, { Component, PropTypes } from "react";
import Radium from 'radium';
import substyle from 'substyle';
import * as Helpers from "./Helpers";
import * as DateUtils from "./DateUtils";
import * as LocaleUtils from "./LocaleUtils";
import defaultStyleDefs from './defaultStyle';

const keys = {
  LEFT: 37,
  RIGHT: 39,
  ENTER: 13,
  SPACE: 32
};

substyle = substyle(defaultStyleDefs)

const Caption = Radium(({ date, locale, localeUtils, children, ...rest }) => (
  <div {...rest} {...substyle(rest)}>
    { children ? 
      React.cloneElement(children, { date, locale, localeUtils }) :
      localeUtils.formatMonthTitle(date, locale) }
  </div>
));


class Day extends Component {

  render() {
    const { 
      day, month, children,
      enableOutsideDays, modifiers,
      onKeyDown, onMouseEnter, onMouseLeave, onTouchTap, onClick, onFocus, onBlur,
      ...rest 
    } = this.props;

    const key = `${day.getFullYear()}${day.getMonth()}${day.getDate()}`;

    const isToday = DateUtils.isSameDay(day, new Date());
    const isOutside = day.getMonth() !== month.getMonth();

    const modifierObj = {
      'today': isToday,
      'outside': isOutside,

      ...Helpers.mapObject(modifiers, checkFn => checkFn(day, { isToday, isOutside }))
    }

    const substyleProps = substyle(rest, {
      '&today': isToday,
      '&outside': isOutside,

      ...Helpers.mapObject(modifierObj, undefined, modifierKey => '&' + modifierKey)
    })

    if (isOutside && !enableOutsideDays) {
      return <div key={ `outside-${key}` } {...substyleProps} />;
    }

    let tabIndex = this.props.tabIndex
    if ((onTouchTap || onClick) && !isOutside) {
      // Focus on the first day of the month
      if (day.getDate() !== 1) {
        tabIndex = -1;
      }
    } else {
      tabIndex = null;
    }

    const modifierKeys = Helpers.filterKeys(modifierObj, (key, val) => val);
    const handlers = Helpers.mapObject({ onKeyDown, onMouseEnter, onMouseLeave, onTouchTap, onClick, onFocus, onBlur },
      handler => (e) => handler(e, day, modifierKeys)
    );

    return (
      <div key={key}
        ref="el"
        {...substyleProps}
        tabIndex={ tabIndex }
        role="gridcell"
        {...handlers}
        >
        { children }
      </div>
    );
  }

  focus() {
    this.refs.el.focus()
  }
}

Day = Radium(Day)

const emptyFunc = () => {}


class DayPicker extends Component {

  static propTypes = {

    initialMonth: PropTypes.instanceOf(Date),
    numberOfMonths: PropTypes.number,

    modifiers: PropTypes.object,

    locale: PropTypes.string,
    localeUtils: PropTypes.shape({
      formatMonthTitle: PropTypes.func,
      formatWeekdayShort: PropTypes.func,
      formatWeekdayLong: PropTypes.func,
      getFirstDayOfWeek: PropTypes.func
    }),

    enableOutsideDays: PropTypes.bool,
    canChangeMonth: PropTypes.bool,
    fromMonth: PropTypes.instanceOf(Date),
    toMonth: PropTypes.instanceOf(Date),

    onDayClick: PropTypes.func,
    onDayTouchTap: PropTypes.func,
    onDayMouseEnter: PropTypes.func,
    onDayMouseLeave: PropTypes.func,
    onMonthChange: PropTypes.func,
    onCaptionClick: PropTypes.func,

    renderDay: PropTypes.func,

    captionElement: PropTypes.element

  };

  static defaultProps = {
    tabIndex: 0,
    initialMonth: new Date(),
    numberOfMonths: 1,
    locale: "en",
    localeUtils: LocaleUtils,
    enableOutsideDays: false,
    canChangeMonth: true,
    renderDay: day => day.getDate(),

    onDayClick: emptyFunc,
    onDayTouchTap: emptyFunc,
    onDayMouseEnter: emptyFunc,
    onDayMouseLeave: emptyFunc,
    onMonthChange: emptyFunc,
    onCaptionClick: emptyFunc,
  };

  constructor(props) {
    super(props);
    this.state = {
      currentMonth: Helpers.startOfMonth(props.initialMonth),
      focusedDay: null
    };
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.initialMonth !== nextProps.initialMonth) {
      this.setState({
        currentMonth: Helpers.startOfMonth(nextProps.initialMonth)
      });
    }
  }

  allowPreviousMonth() {
    const { fromMonth } = this.props;
    if (!fromMonth) {
      return true;
    }
    const { currentMonth } = this.state;
    return Helpers.getMonthsDiff(currentMonth, fromMonth) < 0;
  }

  allowNextMonth() {
    const { toMonth, numberOfMonths } = this.props;
    if (!toMonth) {
      return true;
    }
    const { currentMonth } = this.state;
    return Helpers.getMonthsDiff(currentMonth, toMonth) >= numberOfMonths;
  }

  allowMonth(d) {
    const { fromMonth, toMonth } = this.props;
    if ((fromMonth && Helpers.getMonthsDiff(fromMonth, d) < 0) ||
      (toMonth && Helpers.getMonthsDiff(toMonth, d) > 0)) {
      return false;
    }
    return true;
  }

  showMonth(d) {
    if (!this.allowMonth(d)) {
      return;
    }
    this.setState({
      currentMonth: Helpers.startOfMonth(d)
    });
  }

  showNextMonth(callback) {
    if (!this.allowNextMonth()) {
      return;
    }
    const { currentMonth } = this.state;
    const nextMonth = DateUtils.addMonths(currentMonth, 1);
    this.setState({
      currentMonth: nextMonth
    }, () => {
      if (callback) {
        callback();
      }
      if (this.props.onMonthChange) {
        this.props.onMonthChange(this.state.currentMonth);
      }
    });
  }

  showPreviousMonth(callback) {
    if (!this.allowPreviousMonth()) {
      return;
    }
    const { currentMonth } = this.state;
    const prevMonth = DateUtils.addMonths(currentMonth, -1);
    this.setState({
      currentMonth: prevMonth
    }, () => {
      if (callback) {
        callback();
      }
      if (this.props.onMonthChange) {
        this.props.onMonthChange(this.state.currentMonth);
      }
    });
  }

  focusPreviousDay() {
    if(!this.state.focusedDay) {
      return;
    }

    const setFocus = () => this.refs.beforeFocused.focus()

    if(this.refs.beforeFocused) {
      setFocus()
    } else {
      const { currentMonth } = this.state;
      const { numberOfMonths } = this.props;
      const previousMonth = DateUtils.addMonths(currentMonth, -numberOfMonths);
      this.setState({
        currentMonth: previousMonth
      }, setFocus);
    }
  }

  focusNextDay() {
    if(!this.state.focusedDay) {
      return;
    }

    const setFocus = () => this.refs.afterFocused.focus()

    if(this.refs.afterFocused) {
      setFocus()
    } else {
      const { currentMonth } = this.state;
      const { numberOfMonths } = this.props;
      const nextMonth = DateUtils.addMonths(currentMonth, numberOfMonths);
      this.setState({
        currentMonth: nextMonth
      }, setFocus);
    }
  }

  // Event handlers

  handleKeyDown(e) {
    const { canChangeMonth, onKeyDown } = this.props;

    if (!canChangeMonth && onKeyDown) {
      onKeyDown(e);
      return;
    }

    if (canChangeMonth) {
      switch (e.keyCode) {
      case keys.LEFT:
        this.showPreviousMonth(onKeyDown);
        break;
      case keys.RIGHT:
        this.showNextMonth(onKeyDown);
        break;
      default:
        if (onKeyDown) {
          onKeyDown(e);
        }
      }
    }
  }

  handleDayKeyDown(e, day, modifiers) {
    switch (e.keyCode) {
    case keys.LEFT:
      e.preventDefault();
      e.stopPropagation();
      this.focusPreviousDay(e.target);
      break;
    case keys.RIGHT:
      e.preventDefault();
      e.stopPropagation();
      this.focusNextDay(e.target);
      break;
    case keys.ENTER:
    case keys.SPACE:
      e.preventDefault();
      e.stopPropagation();
      if (this.props.onDayClick) {
        this.handleDayClick(e, day, modifiers);
      }
      if (this.props.onDayTouchTap) {
        this.handleDayTouchTap(e, day, modifiers);
      }
      break;
    }
  }

  handleNextMonthClick() {
    this.showNextMonth();
  }

  handlePrevMonthClick() {
    this.showPreviousMonth();
  }

  handleDayTouchTap(e, day, modifiers) {
    if (modifiers.indexOf("outside") > -1) {
      this.handleOutsideDayPress(day);
    }
    this.props.onDayTouchTap(e, day, modifiers);
  }

  handleDayClick(e, day, modifiers) {
    if (modifiers.indexOf("outside") > -1) {
      this.handleOutsideDayPress(day);
    }

    this.props.onDayClick(e, day, modifiers);
  }

  handleOutsideDayPress(day) {
    const { currentMonth } = this.state;
    const { numberOfMonths } = this.props;
    const diffInMonths = Helpers.getMonthsDiff(currentMonth, day);
    if (diffInMonths > 0 && diffInMonths >= numberOfMonths) {
      this.showNextMonth();
    }
    else if (diffInMonths < 0) {
      this.showPreviousMonth();
    }
  }

  handleDayFocus(e, day, modifiers) {
    this.setState({
      focusedDay: day
    })
  }

  handleDayBlur(e, day, modifiers) {
    this.setState({
      focusedDay: null
    })
  }

  renderNavBar() {
    const isRTL = this.props.dir === "rtl";
    const { className, style } = this.props;

    const leftButton = isRTL ? this.allowNextMonth() : this.allowPreviousMonth();
    const rightButton = isRTL ? this.allowPreviousMonth() : this.allowNextMonth();
    return (
      <div {...substyle({ className, style }, 'nav-bar')}>
        { leftButton &&
          <span
            key="left"
            {...substyle({ className, style }, ['nav-button', 'nav-button-prev'])}
            onClick={ isRTL ? ::this.handleNextMonthClick : ::this.handlePrevMonthClick }
          />
        }
        { rightButton &&
          <span
            key="right"
            {...substyle({ className, style }, ['nav-button', 'nav-button-next'])}
            onClick={  isRTL ? ::this.handlePrevMonthClick : ::this.handleNextMonthClick }
          />
        }
      </div>
    );
  }

  renderMonth(date, i) {
    const { locale, localeUtils, onCaptionClick, captionElement } = this.props;
    const { className, style } = this.props

    return (
      <div
        {...substyle({ className, style }, 'month')}
        key={ i }>

        <Caption {...substyle({ className, style }, 'caption')}
          {...{date, localeUtils, locale}}
          onClick={(e) => onCaptionClick(e, date)}>
          {captionElement}
        </Caption>

        <div {...substyle({ className, style }, 'weekdays')}>
          <div {...substyle({ className, style }, 'weekdays-row')}>
            { this.renderWeekDays() }
          </div>
        </div>
        <div {...substyle({ className, style }, 'body')}>
          { this.renderWeeksInMonth(date) }
        </div>
      </div>
    );
  }

  renderWeekDays() {
    const { locale, localeUtils, className, style } = this.props;
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={ i } {...substyle({ className, style }, 'weekday')}>
          <abbr title={ localeUtils.formatWeekdayLong(i, locale) }>
            { localeUtils.formatWeekdayShort(i, locale) }
          </abbr>
        </div>
      );
    }
    return days;
  }

  renderWeeksInMonth(month) {
    const { locale, localeUtils, className, style } = this.props;
    const firstDayOfWeek = localeUtils.getFirstDayOfWeek(locale);
    return Helpers.getWeekArray(month, firstDayOfWeek).map((week, i) =>
      <div key={ i } {...substyle({ className, style }, 'week')} role="row">
        { week.map(day => this.renderDay(month, day)) }
      </div>
    );
  }

  renderDay(month, day) {
    const { className, style } = this.props

    var ref;
    if(this.state.focusedDay) {
      const isOutside = day.getMonth() !== month.getMonth();
      if(!isOutside) {
        const dayBefore = new Date(this.state.focusedDay.getTime())
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayAfter = new Date(this.state.focusedDay.getTime())
        dayAfter.setDate(dayAfter.getDate() + 1);
        if(DateUtils.isSameDay(dayBefore, day)) {
          ref = "beforeFocused"
        } else if(DateUtils.isSameDay(dayAfter, day)) {
          ref = "afterFocused"
        }
      }
    }

    const props = {
      ...substyle({ className, style }, 'day'),

      enableOutsideDays: this.props.enableOutsideDays, 
      modifiers: this.props.modifiers, 
      tabIndex: this.props.tabIndex,

      onKeyDown: this.handleDayKeyDown.bind(this), 
      onMouseEnter: this.props.onDayMouseEnter, 
      onMouseLeave: this.props.onDayMouseEnter, 
      onTouchTap: this.handleDayTouchTap.bind(this), 
      onClick: this.handleDayClick.bind(this),
      onFocus: this.handleDayFocus.bind(this),
      onBlur: this.handleDayBlur.bind(this),

      month, 
      day
    }

    return <Day {...props} ref={ref}>{ this.props.renderDay(day) }</Day>
  }

  render() {
    const { numberOfMonths, locale, canChangeMonth, className, style, ...attributes } = this.props;
    const { currentMonth } = this.state;

    const months = [];
    let month;
    for (let i = 0; i < numberOfMonths; i++) {
      month = DateUtils.addMonths(currentMonth, i);
      months.push(this.renderMonth(month, i));
    }

    const styleAndClass = substyle(
      { className, style }, 
      { 
        ['&'+locale]: true, 
        '&interaction-disabled': !this.props.onDayClick && !this.props.onDayTouchTap 
      }
    )

    return (
      <div
        {...attributes}
        {...styleAndClass}
        role="widget"
        tabIndex={ canChangeMonth && attributes.tabIndex }
        onKeyDown={ e => this.handleKeyDown(e) }>

        { canChangeMonth && this.renderNavBar() }
        { months }
      </div>
    );
  }


}

export default Radium(DayPicker)
