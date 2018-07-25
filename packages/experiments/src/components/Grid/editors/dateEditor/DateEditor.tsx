import './DateEditor.scss';
import * as React from 'react';
import * as moment from 'moment';
import * as ReactDOM from 'react-dom';

// constants
import { DateFormat, DateStrings } from '../../constants/DateConstants';
import { GridTheme } from '../../common/Types';

// controls
import { BaseComponent } from '../../utilities/BaseComponent';
import { elementContains } from '@uifabric/utilities/lib-commonjs/dom';
import { Calendar, DayOfWeek } from 'office-ui-fabric-react/lib-commonjs/Calendar';
import { Callout, DirectionalHint } from 'office-ui-fabric-react/lib-commonjs/Callout';
import { GridAction, PickerOpenedAction } from '../../actions/GridActions';

// Utilities
import { autobind } from '@uifabric/utilities/lib-commonjs/autobind';
import { css } from '@uifabric/utilities/lib-commonjs/css';

/**
 * The props for Date editor
 */
export interface IDateEditorProps {
    /**
     * Format string for the date
     */
    dateFormat?: string;

    /**
     * The delegate to be called when the value has been updated by the user
     * @param updatedValue - The updated value
     */
    onValueUpdated: (updatedValue: string) => void;

    /**
     * The delegate to be called when the value is updated by the calendar, or the editor loses focus outside the cell
     * @param finalValue - The value sent by the calendar, or the pending value in the input box
     */
    onEditConfirmed: (finalValue: moment.Moment | string) => void;

    /**
     * The value to display in the editor
     */
    value: moment.Moment | string;

    /**
     * The localized label for 'Today' to be used for the DatePicker
     */
    todayLabel: string;

    /**
     * Aria-label for the 'previous month' button.
     */
    prevMonthAriaLabel?: string;

    /**
     * Aria-label for the 'next month' button.
     */
    nextMonthAriaLabel?: string;

    /**
     * Is the user editing the date text using input box
     */
    isTextEditing: boolean;

    /**
     * The optional action performed by the user that the editor may react to
     */
    action?: GridAction;

    /**
     * Delegate to be called when calendar icon is clicked by the user
     */
    onCalendarIconClicked?: () => void;

    /**
     * Theme with information about icon size & color
     */
    theme?: GridTheme;
}

/**
 * The state of the Date editor
 */
export interface IDateEditorState {
    /**
     * Is the calendar callout open?
     */
    isCalendarOpen: boolean;
}

/**
 * The control to be used as a string editor in the Grid.
 * Passes uncommitted updates to the Grid via the onValueUpdated callback
 * The Grid will automatically validate and commit updates when exiting edit mode
 */
export class DateEditor extends BaseComponent<IDateEditorProps, IDateEditorState> {
    /**
     * State for DateEditor
     * Needs to be redefined here so that it can be initialized in this class's ctor
     */
    public state: Readonly<IDateEditorState>;

    public readonly dateEditorContainer: HTMLElement;
    public readonly calendar: Calendar;

    constructor(props: IDateEditorProps, context?: any) {
        super(props, context);

        this.state = {
            isCalendarOpen: props.action != null && props.action.type === PickerOpenedAction.type
        };
    }

    /**
     * Name of the component
     */
    public name(): string {
        return 'DateEditor';
    }

    /**
     * Open the calendar, if PickerOpenedAction was fired and calendar is not currently open
     */
    public componentWillReceiveProps(nextProps: IDateEditorProps) {
        const {
            isCalendarOpen
        } = this.state;

        if (nextProps.action && nextProps.action.type === PickerOpenedAction.type && !isCalendarOpen) {
            this.setState({ isCalendarOpen: true });
        }
    }

    /**
     * Render a text input with a calendar callout
     */
    protected renderComponent(): JSX.Element {
        const {
            isTextEditing
        } = this.props;

        const {
            isCalendarOpen = false
        } = this.state;

        const content: JSX.Element = isTextEditing ?
            <input className="date-editor"
                onChange={ this.onTextInputChanged }
                onClick={ this.onInputClick }
                onMouseDown={ (event: React.MouseEvent<HTMLElement>) => { event.stopPropagation(); } }
                value={ this.getInputValue() }
                autoFocus={ true }
                onFocus={ this.moveCursorEnd }
                onBlur={ this.onBlur }
            /> :
            <div className="date-editor">{this.getInputValue()}</div>;

        const iconStyle: React.CSSProperties = this.props.theme ? {
            color: this.props.theme.selectionBorderColor,
            fontSize: this.props.theme.iconSize
        } : {};

        return (
            <div
                ref={ this.resolveRef(this, 'dateEditorContainer') }
                className="date-editor-container"
            >
                { content }
                <i className={css('ms-Icon ms-Icon--Calendar', { 'calendar-open': isCalendarOpen })}
                    onMouseDown={(event: React.MouseEvent<HTMLElement>) => { event.preventDefault(); event.stopPropagation(); }}
                    onClick={this.onCalendarIconClick}
                    style={iconStyle}
                />
                { this.renderCalendarCallout() }
            </div>
        );
    }

    /**
     * Render the calendar callout if visible
     */
    private renderCalendarCallout(): JSX.Element {
        const {
            value
        } = this.props;

        const {
            isCalendarOpen = false
        } = this.state;

        const initialCalendarValue: moment.Moment = moment.isMoment(value) ? value as moment.Moment : moment();
        if (isCalendarOpen) {
            return (
                <Callout
                    isBeakVisible={ false }
                    gapSpace={ 0 }
                    doNotLayer={ false }
                    target={ this.dateEditorContainer }
                    directionalHint={ DirectionalHint.bottomLeftEdge }
                    onDismiss={ this.onCalendarDismissed }
                    onPositioned={ () => this.calendar.focus() }
                >
                    <Calendar
                        ref={ this.resolveRef(this, 'calendar') }
                        onSelectDate={ this.onCalendarSelectDate }
                        onDismiss={ this.onCalendarDismissed }
                        isMonthPickerVisible={ false }
                        value={ initialCalendarValue.toDate() }
                        firstDayOfWeek={ DayOfWeek.Sunday }
                        strings={ new DateStrings(this.props.todayLabel, this.props.prevMonthAriaLabel, this.props.nextMonthAriaLabel) }
                    >
                    </Calendar>
                </Callout>
            );
        }
    }

    /**
     * Move the cursor of the input to the end of the input on focus
     * @param event The focus event
     */
    @autobind
    private moveCursorEnd(event: React.FocusEvent<HTMLElement>) {
        const input = event.target as HTMLInputElement;
        const length = input.value.length;
        input.setSelectionRange(length, length);
    }

    /**
     * If the input is clicked, close the callout and swallow the event
     * @param event The click event
     */
    @autobind
    private onInputClick(event: React.MouseEvent<HTMLElement>): void {
        this.onCalendarDismissed();
        event.stopPropagation();
    }

    /**
     * When the calendar icon is clicked, toggle the calendar callout
     * @param event
     */
    @autobind
    private onCalendarIconClick(event: React.MouseEvent<HTMLElement>): void {
        const {
            onCalendarIconClicked
        } = this.props;

        event.preventDefault();
        event.stopPropagation();
        this.setState((prevState: IDateEditorState) => {
            prevState.isCalendarOpen = !prevState.isCalendarOpen;
            return prevState;
        });

        if (onCalendarIconClicked) {
            onCalendarIconClicked();
        }
    }

    /**
     * When a date is selected from the calendar, send a pending update to Grid
     * @param date The selected date
     */
    @autobind
    private onCalendarSelectDate(date: Date): void {
        const {
            onEditConfirmed
        } = this.props;

        const momentDate = moment(date.toISOString());

        // Send the pending update to the Grid
        onEditConfirmed(momentDate);

        // Dismiss the callout
        this.onCalendarDismissed();
    }

    /**
     * Dismiss the callout
     */
    @autobind
    private onCalendarDismissed(event?: any): void {
        // OnDismiss could be the result of a propagated event which we dont want to handle.
        if (!(event && event.type)) {
            this.setState((prevState: IDateEditorState) => {
                prevState.isCalendarOpen = false;
                return prevState;
            });
        }
    }

    /**
     * When a user types text into the cell, set the partial value
     * @param event
     */
    @autobind
    private onTextInputChanged(event: React.FormEvent<HTMLElement>): void {
        const {
            onValueUpdated
        } = this.props;

        onValueUpdated((event.target as HTMLInputElement).value);
    }

    /**
     * Returns the string to be displayed in the input box
     */
    private getInputValue(): string {
        const {
            dateFormat = DateFormat.GridDate,
            value
        } = this.props;

        // if a moment object was passed as input, display the formatted string
        if (moment.isMoment(value)) {
            return (value as moment.Moment).format(dateFormat);
        }
        if (value == null) {
            return '';
        }

        return value;
    }

    /**
     * Commit the pending value when the editor loses focus, unless focus goes to the calendar callout on the same cell
     * @param event The associated focus event
     */
    @autobind
    private onBlur(event: React.FocusEvent<HTMLElement>) {
        const {
            onEditConfirmed,
            value
        } = this.props;

        // if the focus is going to the calendar of the same cell, we do not want to commit the pending update
        if (this.calendar) {

            // In chrome, we get next focused element through event.relatedTarget,
            // while document.activeElement is 'body' at this point,
            // whereas in IE, event.relatedTarget is always null and document.activeElement gives the correct element,
            // so we need a mix of both here
            const nextFocusedElement: HTMLElement = (event.relatedTarget || document.activeElement) as HTMLElement;
            const calendarElement = ReactDOM.findDOMNode(this.calendar) as HTMLElement;
            if (elementContains(calendarElement, nextFocusedElement)) {
                return;
            }
        }

        if (onEditConfirmed) {
            onEditConfirmed(value);
        }
    }
}