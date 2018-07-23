// OneDrive:IgnoreCodeCoverage
import { IDatePickerStrings } from 'office-ui-fabric-react/lib/DatePicker';
import * as moment from 'moment';

/**
 * Date strings for use in fabric date pickers
 */
export class DateStrings implements IDatePickerStrings {
  public months: string[];
  public shortMonths: string[];
  public days: string[];
  public shortDays: string[];
  public goToToday: string;
  public prevMonthAriaLabel: string;
  public nextMonthAriaLabel: string;

  constructor(todayLabel: string, prevMonthAriaLabel?: string, nextMonthAriaLabel?: string) {
    this.months = moment.months();
    this.shortMonths = moment.monthsShort();
    this.days = moment.weekdays();
    this.shortDays = moment.weekdaysShort();
    this.goToToday = todayLabel;
    this.prevMonthAriaLabel = prevMonthAriaLabel;
    this.nextMonthAriaLabel = nextMonthAriaLabel;
  }
}

export class DateFormat {
  /** Format for dates in the grid, ie: 1/2/2034 */
  public static readonly GridDate = 'l';
  /** Dates for Text fields from Project Server */
  public static readonly TextDateTimeField = 'L LT';
  /** Format for 01/02/2034 */
  public static readonly FullDigitDateFormat = 'L';
}
