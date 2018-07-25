import './PeoplePicker.scss';

import * as _ from 'lodash';
import * as React from 'react';

// Components
import { BaseComponent } from '../../utilities/BaseComponent';
import { ResourceList, IResourceListProps } from './ResourceList';
import { SearchBox, ISearchBox } from 'office-ui-fabric-react/lib-commonjs/SearchBox';

// Constants
import { KeyCode } from '../../constants/KeyboardConstants';

// Models
import { Identifiable } from './Identifiable';
import { IPersonaProps } from 'office-ui-fabric-react/lib-commonjs/components/Persona/index';

export interface IPeoplePickerProps {
    /** Resource lists to display */
    resourceLists: IResourceListProps[];
    /** Search value to pre-populate search box */
    searchValue?: string;
    /** Minimum search box entry length before calling search function */
    searchBoxMinimumSearchableLength?: number;
    /** Text to display when there are no results returned from search */
    searchBoxNoResultsText?: string;
    /** Delay between calling consecutive searches */
    searchBoxResponseDelayTime?: number;
    /** Have the searched resources been fetched yet? */
    searchedResourcesFetched?: boolean;
    /** Should the text input box focus on mount? */
    shouldFocusOnMount?: boolean;
    /** Text displayed when search box is empty */
    filterBoxPlaceholderText?: string;
    /** Callback function to fetch filtered resources when a filter is typed. */
    fetchFilteredResources: (searchString: string) => void;
    /** Callback function to return the changed search string. */
    onSearchStringChanged?: (searchString: string) => void;
    /** Callback to dismiss people picker */
    onDismiss?: () => void;
    /** Callback function to filter each resource when a filter is typed. */
    onFilter?: (
        filterStr: string,
        resource: Identifiable<IPersonaProps>,
        index: number,
        resourceList: Identifiable<IPersonaProps>[]
    ) => boolean;
    /** While searching/filtering the resource list, this mapping function will be applied to all the elements in order to make some fields visible. */
    onFilterMapResults?: (
        resource: Identifiable<IPersonaProps>,
        index: number,
        resourceList: Identifiable<IPersonaProps>[]
    ) => Identifiable<IPersonaProps>;
}

export interface IPeoplePickerState {
    /** Current value of the searchBox control */
    searchBoxText: string;
    /** SearchBoxText is ready for use as a search filter */
    isSearchFilterTextReady: boolean;
}
/**
 * The default minimum searchable length for search box.
 */
export const DEFAULT_MIN_SEARCHABLE_LENGTH = 3;

/**
 * The default delay for the search action.
 */
export const DEFAULT_SEARCH_DELAY = 500;

/**
 * Component to allow searching and choosing people from various buckets.
 */
export class PeoplePicker extends BaseComponent<IPeoplePickerProps, IPeoplePickerState> {
    public static defaultProps = {
        searchBoxMinimumSearchableLength: DEFAULT_MIN_SEARCHABLE_LENGTH,
        searchBoxResponseDelayTime: DEFAULT_SEARCH_DELAY,
        shouldFocusOnMount: false,
        filterBoxPlaceholderText: ''
    };

    /**
     * State for PeoplePicker
     * Needs to be redefined here so that it can be initialized in this class's ctor
     */
    public state: Readonly<IPeoplePickerState>;

    public readonly root: HTMLElement;
    public readonly textInput: ISearchBox;

    // Number of resources found by filtered search
    private filteredResourceListCount: number;

    constructor(props: IPeoplePickerProps, context?: any) {
        super(props, context);

        // initialize state
        this.state = {
            searchBoxText: '',
            isSearchFilterTextReady: false
        };
    }

    /**
     * React lifecycle hook that runs once immediately prior to first render.
     */
    public componentWillMount(): void {
        this.onFilter(this.props.searchValue);
    }

    /**
     * React lifecycle hook that runs once immediately after first render.
     */
    public componentDidMount(): void {
        if (this.props.shouldFocusOnMount && this.textInput != null) {
            this.textInput.focus();
        }
    }

    /**
     * Name of the component
     */
    public name(): string {
        return 'PeoplePicker';
    }

    protected renderComponent(): JSX.Element {
        const {
            filterBoxPlaceholderText = PeoplePicker.defaultProps.filterBoxPlaceholderText,
            resourceLists,
            searchBoxResponseDelayTime = PeoplePicker.defaultProps.searchBoxResponseDelayTime,
            searchBoxNoResultsText,
            searchedResourcesFetched
        } = this.props;
        const { searchBoxText } = this.state;

        let resourceListKeys = 0;
        this.filteredResourceListCount = 0;
        return (
            <div className="peoplePicker" ref={ this.resolveRef(this, 'root') } onKeyUp={ this.onKeyUp }>
                <SearchBox
                    { ...{ autofocus: true } }
                    componentRef={ this.resolveRef(this, 'textInput') }
                    placeholder={ filterBoxPlaceholderText }
                    onChange={ _.throttle(this.onFilter, searchBoxResponseDelayTime) }
                    value={ searchBoxText }
                    onFocus={ this.moveCursorEnd }
                />
                <div className="peoplePicker-results">
                    <div className="peoplePicker-resultGroups">
                        { _.map(resourceLists, (resourceListGroup: IResourceListProps) =>
                            this.renderResourceGroup(resourceListGroup, resourceListKeys++)
                        ) }
                    </div>
                </div>
                {
                    this.filteredResourceListCount === 0 && searchedResourcesFetched &&
                    <div className="peoplePicker-noresults">{ searchBoxNoResultsText }</div>
                }
            </div>
        );
    }

    /**
     * Render a resource group
     * @param resourceListGroup The group data
     * @param resourceIndex The index of the group
     */
    private renderResourceGroup(resourceListGroup: IResourceListProps, resourceIndex: number): JSX.Element {
        if (!resourceListGroup) {
            return;
        }

        const filteredResourceList: Identifiable<IPersonaProps>[] = this.restrictGroupResults(resourceListGroup);

        // Check if search has results
        if (filteredResourceList) {
            this.filteredResourceListCount += filteredResourceList.length;
        }

        return (
            <ResourceList
                key={ resourceIndex }
                compactMode={ resourceListGroup.compactMode }
                listHeaderText={ resourceListGroup.listHeaderText }
                resourceList={ filteredResourceList }
                maxSearchResults={ resourceListGroup.maxSearchResults }
                resourceAriaLabel={ resourceListGroup.resourceAriaLabel }
                showHeaderIfNoData={ resourceListGroup.showHeaderIfNoData }
                onItemClick={ this.curriedOnItemClick(resourceListGroup) }
                onItemRemoveClick={ this.curriedOnItemRemoveClick(resourceListGroup) }
                onItemKeyUp={ this.curriedOnItemKeyUp(resourceListGroup) }
            />
        );
    }

    /**
     * Returns handler for resource click
     * @param {IResourceListProps} resourceListGroup the resource list
     * @returns {(resourceId: string) => void} the event handler
     */
    private curriedOnItemClick = (resourceListGroup: IResourceListProps) =>
        resourceListGroup.onItemClick && ((resourceId: string) => this.clearSearchAndExecute(resourceListGroup.onItemClick, resourceId));

    /**
     * Returns handler for resource remove click
     * @param {IResourceListProps} resourceListGroup resourceListGroup the resource list
     * @returns {(resourceId: string) => void} the event handler
     */
    private curriedOnItemRemoveClick = (resourceListGroup: IResourceListProps) =>
        resourceListGroup.onItemRemoveClick &&
        ((resourceId: string) => this.clearSearchAndExecute(resourceListGroup.onItemRemoveClick, resourceId));

    /**
     * Returns handler for resource text change.
     * @param {IResourceListProps} resourceListGroup resourceListGroup the resource list
     * @returns {(ev: React.KeyboardEvent<HTMLElement>, resourceId: string) => any} the event handler
     */
    private curriedOnItemKeyUp = (resourceListGroup: IResourceListProps) =>
        resourceListGroup.onItemKeyUp &&
        ((ev: React.KeyboardEvent<HTMLElement>, resourceId: string) =>
            this.clearSearchOnExecute((ev, resourceId) => resourceListGroup.onItemKeyUp(ev, resourceId), ev, resourceId));
    /**
     * Invokes action then, if action returns true, clears search filter and box text for next search
     * else leaves state and active element the same
     * @param {(ev: React.KeyboardEvent<HTMLElement>, ...args: any[]) => boolean} action Action to be called before filter is cleared.  Should return true if filter should be cleared.
     * @param {React.KeyboardEvent<HTMLElement>} ev The keyboard event that was triggered
     * @param {string} resourceId Id of the resource being updated
     */
    private clearSearchOnExecute(
        action: (ev: React.KeyboardEvent<HTMLElement>, ...args: any[]) => boolean,
        ev: React.KeyboardEvent<HTMLElement>,
        resourceId: string
    ): boolean {
        const success: boolean = action(ev, resourceId);
        if (success) {
            if (this.textInput != null) {
                this.textInput.focus();
            }
            this.setState({ searchBoxText: '', isSearchFilterTextReady: false });
        }
        return success;
    }

    /**
     * Returns focus to the searchBox control then clears search filter and box text for next search
     * Clears search filter and box text for next search
     * @param {(resourceId: string) => void} action Action to be called after filter is cleared
     * @param {string} resourceId Id of the resource to pass to the action function
     */
    private clearSearchAndExecute(action: (resourceId: string) => void, resourceId: string) {
        if (this.textInput != null) {
            this.textInput.focus();
        }
        this.setState({ searchBoxText: '', isSearchFilterTextReady: false });
        action(resourceId);
    }

    /**
     * Restrict data for group based on group settings
     * @param resourceListGroup Resources in group
     */
    private restrictGroupResults(resourceListGroup: IResourceListProps): Identifiable<IPersonaProps>[] {
        const { onFilterMapResults } = this.props;
        const { isSearchFilterTextReady, searchBoxText } = this.state;

        // Don't show anything if this group should be suppressed until search is performed.
        let filteredResourceList: Identifiable<IPersonaProps>[] = !resourceListGroup.suppressDataDisplayUntilSearch
            ? resourceListGroup.resourceList
            : [];

        const onFilter = this.curriedOnFilter(searchBoxText);

        if (isSearchFilterTextReady) {
            if (searchBoxText.trim() !== '') {
                filteredResourceList = onFilter ? _.filter(resourceListGroup.resourceList, onFilter) : resourceListGroup.resourceList;

                if (resourceListGroup.maxSearchResults) {
                    filteredResourceList = _.take(filteredResourceList, resourceListGroup.maxSearchResults);
                }
            }

            // If a mapping function is received, it will be applied to all the elements.
            if (onFilterMapResults) {
                filteredResourceList = _.map(filteredResourceList, onFilterMapResults);
            }
        }

        return filteredResourceList;
    }

    /**
     * Returns handler for resource filter
     * @param {string} searchText the search text
     * @param {IResourceListProps} resourceListGroup the resource list
     * @returns {(resource: Identifiable<IPersonaProps>, index: number, resourceList: Identifiable<IPersonaProps>[]) => boolean} the event handler
     */
    private curriedOnFilter(
        searchText: string
    ): (resource: Identifiable<IPersonaProps>, index: number, resourceList: Identifiable<IPersonaProps>[]) => boolean {
        const { onFilter } = this.props;
        if (onFilter) {
            return (resource: Identifiable<IPersonaProps>, index: number, resourceList: Identifiable<IPersonaProps>[]): boolean => {
                return onFilter(searchText, resource, index, resourceList);
            };
        }
        return undefined;
    }

    /**
     * Handles filter text updates
     * @param newValue The updated filter value
     */
    private onFilter = (newValue: string): void => {
        const {
            fetchFilteredResources,
            onSearchStringChanged,
            searchBoxMinimumSearchableLength = PeoplePicker.defaultProps.searchBoxMinimumSearchableLength
        } = this.props;
        const { searchBoxText } = this.state;
        let isSearchFilterTextReady = false;

        if (searchBoxText !== newValue) {
            // Do search if the search box has the minimum number of characters in it
            if (newValue != null && newValue.trim().length >= searchBoxMinimumSearchableLength) {
                fetchFilteredResources(newValue);
                isSearchFilterTextReady = true;
            }

            const newSearchString = newValue || '';
            if (onSearchStringChanged) {
                onSearchStringChanged(newSearchString);
            }
            this.setState({ searchBoxText: newSearchString, isSearchFilterTextReady: isSearchFilterTextReady });
        }
    };

    /**
     * Move the cursor of the input to the end of the input on focus
     * @param event The focus event
     */
    private moveCursorEnd = (event: React.FocusEvent<HTMLElement>) => {
        const input = event.target as HTMLInputElement;
        const length = input.value.length;
        input.setSelectionRange(length, length);
    };

    /**
     * Handles key up on PeoplePicker
     * @param {React.KeyboardEvent<HTMLElement>} event The event that triggered this callback
     */
    private onKeyUp = (event: React.KeyboardEvent<HTMLElement>): void => {
        if (event.keyCode === KeyCode.ESCAPE && this.state.searchBoxText.length === 0) {
            const { onDismiss } = this.props;
            if (onDismiss) {
                onDismiss();
            }
        }
    };
}
