// models
import { MomentCalendarCell } from './MomentCalendarCell';

/**
 * Moment type for Grid
 * Returns a rendered date string
 */
export class MomentDateCell extends MomentCalendarCell {

    /**
     * Constucts a MomentDateCell
     * @param errorMessage error message to display to a user if they enter an invalid value
     * @param todayLabel localized string for 'Today' displayed in the datepicker when selecting dates
     * @param dateFormat language agnostic moment format string, e.g. L or LT NOT DD/MM/YYYY
     * @param prevMonthAriaLabel an optional Aria-label for the 'previous month' button.
     * @param nextMonthAriaLabel an optional Aria-label for the 'next month' button.
     */
    constructor(errorMessage: string, todayLabel: string, dateFormat: string, prevMonthAriaLabel?: string, nextMonthAriaLabel?: string) {
        super(
            errorMessage,
            todayLabel,
            {
                sameDay: dateFormat,
                nextDay: dateFormat,
                nextWeek: dateFormat,
                lastDay: dateFormat,
                lastWeek: dateFormat,
                sameElse: dateFormat
            },
            prevMonthAriaLabel,
            nextMonthAriaLabel);
    }
}