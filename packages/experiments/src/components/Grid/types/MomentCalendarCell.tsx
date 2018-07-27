import * as moment from 'moment';
import * as React from 'react';

import { DateEditor } from '../editors/dateEditor/DateEditor';
import { DateFormat } from '../constants/DateConstants';
import { GridAction, PickerOpenedAction } from '../actions/GridActions';
import { ICellType, CellContext } from '../grid/Grid';

// Validators
import { Validators } from '../validators/Validators';

/**
 * The moment calendar date type for Grid which is also used by MomentDateCell.
 * Returns moment calendar string which is a different format depending on date.
 * e.g. new MomentCalendarCell({
 *                  sameDay: '[Today]',
 *                  nextDay: '[Tomorrow]',
 *                  nextWeek: 'dddd',
 *                  lastDay: '[Yesterday]',
 *                  lastWeek: '[Last] dddd'
 *              })
 * See https://momentjs.com/docs/#/displaying/calendar-time/
 *
 */
export class MomentCalendarCell implements ICellType {
    /**
     * Does the cell support callout for editing, so that the grid would open it in Alt + Down
     * Ideally, this should be handled by the editor, but since we want to allow Alt + Down in Select state,
     * the grid has to listen to the event, and react to it
     */
    public get supportsCalloutForEditing(): boolean {
        return true;
    }

    private calendarFormat: moment.CalendarSpec;
    private validationFailureErrorMessage: string;
    private todayLabel: string;
    private prevMonthAriaLabel?: string;
    private nextMonthAriaLabel?: string;

    /**
     * Create an instance of MomentCalendarCell
     * @param validationFailureErrorMessage is the localized validation error used for this cell
     * @param todayLabel is the localized today string used in dateEditor
     * @param calendarFormat an optional moment calendar format. Default Calendar:
     * sameDay: '[Today]',
     * nextDay: '[Tomorrow]',
     * nextWeek: 'dddd',
     * lastDay: '[Yesterday]',
     * lastWeek: '[Last] dddd',
     * sameElse: 'DD/MM/YYYY'
     * @param prevMonthAriaLabel an optional Aria-label for the 'previous month' button.
     * @param nextMonthAriaLabel an optional Aria-label for the 'next month' button.
     */
    constructor(validationFailureErrorMessage: string, todayLabel: string, calendarFormat?: moment.CalendarSpec,
        prevMonthAriaLabel?: string, nextMonthAriaLabel?: string) {
        if (calendarFormat) {
            this.calendarFormat = calendarFormat;
        }

        this.prevMonthAriaLabel = prevMonthAriaLabel;
        this.nextMonthAriaLabel = nextMonthAriaLabel;
        this.validationFailureErrorMessage = validationFailureErrorMessage;
        this.todayLabel = todayLabel;
    }

    /**
     * Given the cell data, return a rendered JSX.Element.
     */
    public render(cellData: moment.Moment, context: CellContext): React.ReactNode {
        return this.toString(cellData);
    }

    /**
     * Render a date editor
     * @param cellData The moment date to show in this cell
     * @param pendingUpdate - The pending update value to be used in the editor
     * @param action The user action performed on the cell
     * @param onValueUpdated The update value delegate
     * @param onEditCancelled The delegate to call to request the cancelling of any updates
     * @param onEditConfirmed The delegate to call to commit an update
     * @param context The cell context which provides additional properties, usable for rendering
     */
    public renderEditor(
        cellData: moment.Moment,
        pendingUpdate: string | moment.Moment,
        action: GridAction,
        onValueUpdated: (value: string) => void,
        onEditCancelled: () => void,
        onEditConfirmed: (finalValue: moment.Moment) => void,
        context: CellContext
    ): React.ReactNode {
        return (
            // sameElse is type string | moment.formatFunction so need to type check and use if a string otherwise undefined.
            <DateEditor
                dateFormat={ (this.calendarFormat && typeof this.calendarFormat.sameElse === 'string') ?
                this.calendarFormat.sameElse : undefined }
                value={ pendingUpdate !== null ? pendingUpdate : cellData }
                onValueUpdated={ onValueUpdated }
                onEditConfirmed={ onEditConfirmed }
                todayLabel={ this.todayLabel }
                prevMonthAriaLabel={ this.prevMonthAriaLabel }
                nextMonthAriaLabel={ this.nextMonthAriaLabel }
                isTextEditing={ true }
                action={ action }
                theme={ context.theme }
            />
        );
    }

    /**
     * Return a JSX.Element or string in the selected mode, when this is the primary cell in the selection
     * @param cellData The cell data extracted through property or accessor
     * @param transitionToEditMode The delegate to transition the grid to edit mode. Accepts optional action that would be
     * passed to renderEditor
     * @param context The cell context which provides additional properties, usable for rendering
     */
    public renderSelected(
        cellData: moment.Moment,
        transitionToEditMode: (action?: GridAction) => void,
        context: CellContext
    ): React.ReactNode {
        if (context.isEditable(context.coordinate)) {
            const onCalendarClick =  () => transitionToEditMode(new PickerOpenedAction());
            return (
                // sameElse is type string | moment.formatFunction so need to type check and use if a string otherwise undefined.
                <DateEditor
                    dateFormat={ (this.calendarFormat && typeof this.calendarFormat.sameElse === 'string') ?
                    this.calendarFormat.sameElse : undefined }
                    value={ cellData }
                    onValueUpdated={ undefined }
                    onEditConfirmed={ undefined }
                    todayLabel={ this.todayLabel }
                    prevMonthAriaLabel={ this.prevMonthAriaLabel }
                    nextMonthAriaLabel={ this.nextMonthAriaLabel }
                    isTextEditing={ false }
                    onCalendarIconClicked={ onCalendarClick }
                    theme={ context.theme }
                />
            );
        } else {
            return this.render(cellData, context);
        }
    }

    /**
     * Given the cell data, return the aria label to be used for screen-readers
     */
    public getAriaLabel(cellData: moment.Moment): string {
        return this.toString(cellData);
    }

    /**
     * Compare two moment objects
     * @param left The left date
     * @param right The right date
     */
    public sortComparator(left: moment.Moment, right: moment.Moment): number {
        // null/undefined set to 0 so that they come before all valid moment objects
        return (left ? left.valueOf() : 0) - (right ? right.valueOf() : 0);
    }

    /**
     * Default validator, ensure the value is a valid moment object
     * @param value The moment to validate
     */
    public validate(value: moment.Moment): string | undefined {
        return Validators.validMoment(this.validationFailureErrorMessage)(value);
    }

    /**
     * Returns the string representation of the cell data
     * @param cellData The cell data extracted through property or accessor
     */
    public toString(cellData: moment.Moment): string {
        if (cellData && this.validate(cellData) === null) {
            // if validate returns no error, this is a valid moment
            return cellData.calendar(undefined, this.calendarFormat ? this.calendarFormat : undefined);
        }
        return '';
    }

    /**
     * Parses the raw input by the user
     * @param originalValue The cell data extracted through property or accessor
     * @param changedValue The raw input to parse to Object
     */
    // tslint:disable-next-line:no-any
    public parseRawInput(originalValue: moment.Moment, changedValue: any): moment.Moment | null {
        if (!changedValue) {
            return null;
        }

        // if already a moment object return it
        if (changedValue && moment.isMoment(changedValue)) {
            // If we already are a moment, return it
            return changedValue;
        } else {
            // Make a list of valid string formats we accept for this cell type
            const validFormats = [
                moment.ISO_8601,
                DateFormat.GridDate,
                DateFormat.FullDigitDateFormat
            ];
            return moment(changedValue, validFormats, true /* strict */);
        }
    }
}
