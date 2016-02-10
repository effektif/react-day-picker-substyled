import React, { Component, PropTypes } from "react";
import substyle from 'substyle';
import * as Helpers from "./Helpers";
import * as DateUtils from "./DateUtils";
import * as LocaleUtils from "./LocaleUtils";

const keys = {
  LEFT: 37,
  RIGHT: 39,
  ENTER: 13,
  SPACE: 32
};

const Caption = ({ date, locale, localeUtils, ...rest }) => (
  <div {...rest} {...substyle(rest)}>
    { localeUtils.formatMonthTitle(date, locale) }
  </div>
);

const Day = ({ 
  day, month, children,
  enableOutsideDays, modifiers, tabIndex,
  onKeyDown, onMouseEnter, onMouseLeave, onTouchTap, onClick,
  ...rest 
}) => {
  const key = `${day.getFullYear()}${day.getMonth()}${day.getDate()}`;

  const isToday = DateUtils.isSameDay(day, new Date());
  const isOutside = day.getMonth() !== month.getMonth();

  const modifierObj = {
    'today': isToday,
    'outside': isOutside,

    ...Helpers.mapObject(modifiers, checkFn => checkFn(day))
  }

  const substyleProps = substyle(rest, {
    '&today': isToday,
    '&outside': isOutside,

    ...Helpers.mapObject(modifierObj, undefined, modifierKey => '&' + modifierKey)
  })

  if (isOutside && !enableOutsideDays) {
    return <div key={ `outside-${key}` } {...substyleProps} />;
  }

  if ((onTouchTap || onClick) && !isOutside) {
    // Focus on the first day of the month
    if (day.getDate() !== 1) {
      tabIndex = -1;
    }
  } else {
    tabIndex = null;
  }

  const modifierKeys = Helpers.filterKeys(modifierObj, (key, val) => val);
  const handlers = Helpers.mapObject({ onKeyDown, onMouseEnter, onMouseLeave, onTouchTap, onClick },
    handler => (e) => handler(e, day, modifierKeys)
  );

  return (
    <div key={ key } {...substyleProps}
      tabIndex={ tabIndex }
      role="gridcell"
      {...handlers}
      >
      { children }
    </div>
  );
}

const emptyFunc = () => {}

export default class DayPicker extends Component {

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
    captionElement: <Caption />,

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
      currentMonth: Helpers.startOfMonth(props.initialMonth)
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

  focusPreviousDay(dayNode) {
    const body = dayNode.parentNode.parentNode.parentNode.parentNode;
    let dayNodes = body.querySelectorAll(".DayPicker-Day:not(.DayPicker-Day--outside)");
    let nodeIndex;
    for (let i = 0; i < dayNodes.length; i++) {
      if (dayNodes[i] === dayNode) {
        nodeIndex = i;
        break;
      }
    }
    if (nodeIndex === 0) {
      const { currentMonth } = this.state;
      const { numberOfMonths } = this.props;
      const prevMonth = DateUtils.addMonths(currentMonth, -numberOfMonths);
      this.setState({
        currentMonth: prevMonth
      }, () => {
        dayNodes = body.querySelectorAll(".DayPicker-Day:not(.DayPicker-Day--outside)");
        dayNodes[dayNodes.length - 1].focus();
      });
    }
    else {
      dayNodes[nodeIndex - 1].focus();
    }
  }

  focusNextDay(dayNode) {
    const body = dayNode.parentNode.parentNode.parentNode.parentNode;
    let dayNodes = body.querySelectorAll(".DayPicker-Day:not(.DayPicker-Day--outside)");
    let nodeIndex;
    for (let i = 0; i < dayNodes.length; i++) {
      if (dayNodes[i] === dayNode) {
        nodeIndex = i;
        break;
      }
    }

    if (nodeIndex === dayNodes.length - 1) {
      const { currentMonth } = this.state;
      const { numberOfMonths } = this.props;
      const nextMonth = DateUtils.addMonths(currentMonth, numberOfMonths);
      this.setState({
        currentMonth: nextMonth
      }, () => {
        dayNodes = body.querySelectorAll(".DayPicker-Day:not(.DayPicker-Day--outside)");
        dayNodes[0].focus();
      });
    }
    else {
      dayNodes[nodeIndex + 1].focus();
    }
  }

  // Event handlers

  handleKeyDown(e) {
    if (!this.props.canChangeMonth && this.props.onKeyDown) {
      this.props.onKeyDown(e);
      return;
    }

    if (this.props.canChangeMonth) {
      const callback = this.props.onKeyDown ? () => this.props.onKeyDown(e) : null;

      switch (e.keyCode) {
      case keys.LEFT:
        this.showPreviousMonth(callback);
        break;
      case keys.RIGHT:
        this.showNextMonth(callback);
        break;
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

  renderNavBar() {
    const isRTL = this.props.dir === "rtl";

    const leftButton = isRTL ? this.allowNextMonth() : this.allowPreviousMonth();
    const rightButton = isRTL ? this.allowPreviousMonth() : this.allowNextMonth();
    return (
      <div {...substyle(this.props, 'nav-bar')}>
        { leftButton &&
          <span
            key="left"
            {...substyle(this.props, ['nav-button', 'nav-button-prev'])}
            onClick={ isRTL ? ::this.handleNextMonthClick : ::this.handlePrevMonthClick }
          />
        }
        { rightButton &&
          <span
            key="right"
            {...substyle(this.props, ['nav-button', 'nav-button-next'])}
            onClick={  isRTL ? ::this.handlePrevMonthClick : ::this.handleNextMonthClick }
          />
        }
      </div>
    );
  }

  renderMonth(date, i) {
    const { locale, localeUtils, onCaptionClick, captionElement } = this.props;

    const substyleProps = !captionElement.className && !captionElement.style ?
      substyle(this.props, 'caption') : {}

    const caption = React.cloneElement(captionElement, {
      ...substyleProps,
      date, localeUtils, locale,
      onClick: (e) => onCaptionClick(e, date)
    });

    return (
      <div
        {...substyle(this.props, 'month')}
        key={ i }>

        { caption }

        <div {...substyle(this.props, 'weekdays')}>
          <div {...substyle(this.props, 'weekdays-row')}>
            { this.renderWeekDays() }
          </div>
        </div>
        <div {...substyle(this.props, 'body')}>
          { this.renderWeeksInMonth(date) }
        </div>
      </div>
    );
  }

  renderWeekDays() {
    const { locale, localeUtils } = this.props;
    const days = [];
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={ i } {...substyle(this.props, 'weekday')}>
          <abbr title={ localeUtils.formatWeekdayLong(i, locale) }>
            { localeUtils.formatWeekdayShort(i, locale) }
          </abbr>
        </div>
      );
    }
    return days;
  }

  renderWeeksInMonth(month) {
    const { locale, localeUtils } = this.props;
    const firstDayOfWeek = localeUtils.getFirstDayOfWeek(locale);
    return Helpers.getWeekArray(month, firstDayOfWeek).map((week, i) =>
      <div key={ i } {...substyle(this.props, 'week')} role="row">
        { week.map(day => this.renderDay(month, day)) }
      </div>
    );
  }

  renderDay(month, day) {
    const props = {
      ...substyle(this.props, 'day'),

      enableOutsideDays: this.props.enableOutsideDays, 
      modifiers: this.props.modifiers, 
      tabIndex: this.props.tabIndex,

      onKeyDown: this.handleDayKeyDown.bind(this), 
      onMouseEnter: this.props.onDayMouseEnter, 
      onMouseLeave: this.props.onDayMouseEnter, 
      onTouchTap: this.handleDayTouchTap.bind(this), 
      onClick: this.handleDayClick.bind(this),

      month, 
      day
    }
    return <Day {...props}>{ this.props.renderDay(day) }</Day>
  }

  render() {
    const { numberOfMonths, locale, canChangeMonth, ...attributes } = this.props;
    const { currentMonth } = this.state;

    const months = [];
    let month;
    for (let i = 0; i < numberOfMonths; i++) {
      month = DateUtils.addMonths(currentMonth, i);
      months.push(this.renderMonth(month, i));
    }

    const substyleProps = substyle(this.props, { 
      ['&'+locale]: true, 
      '&interaction-disabled': !this.props.onDayClick && !this.props.onDayTouchTap }
    )

    return (
      <div 
        role="widget"
        tabIndex={ canChangeMonth && attributes.tabIndex }
        onKeyDown={ e => this.handleKeyDown(e) }
        {...attributes}
        {...substyleProps}>
        { canChangeMonth && this.renderNavBar() }
        { months }
      </div>
    );
  }


}
