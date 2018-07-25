import { IResource } from '../../controls/resourcePicker/IResource';

/**
 * Type that contains information for rendering the resource cell.
 */
export type ResourceEditorData = {
    /**
     * Id of the row for which the people picker has been opened
     */
    rowId: string;

    /**
     * Resources for the face pile cell to render.
     */
    assignedResources: IResource[];

    /**
     * Total number of resources for face pile overflow.
     */
    total?: number;

    /**
     * Search result for resources assigned to the line.
     */
    assignedResourcesSearchList: IAssignedResourcesList;

    /**
     * List of search results for unassigned resources.
     */
    unassignedResourcesSearchLists: IUnassignedResourcesList[];
};

/**
 * Unassigned resource list
 */
export interface IUnassignedResourcesList {
    /**
     * Header label for group
     */
    label: string;

    /**
     * Callback to get the result resources
     */
    resources: () => IResource[];

    /**
     * Callback for resource assign
     */
    onClick: (taskId: string, resourceId: string) => void;

    /**
     * Callback to determine if this group visible
     */
    isVisible: (search: string) => boolean;

    /**
     * Maximum number of results to display
     */
    maxResult?: number;
}

/**
 * Assigned resource list.
 */
export interface IAssignedResourcesList {
    /**
     * Header label for group.
     */
    label: string;

    /**
     * Callback to get the result resources.
     */
    resources: () => IResource[];

    /**
     * Callback for remove.
     */
    onRemove: (taskId: string, resourceId: string) => void;

    /**
     * Maximum number of results to display
     */
    maxResult?: number;
}
