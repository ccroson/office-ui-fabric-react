import { PersonaPresence } from 'office-ui-fabric-react';
/**
 * Representation of resource.
 */
export interface IResource {
    /**
     * The resource id
     */
    id: string;

    /**
     * The resource name
     */
    name: string;

    /**
     * The resource presence
     */
    presence?: PersonaPresence;

    /**
     * The resource title
     */
    title?: string;

    /**
     * The resource email
     */
    email?: string;

    /**
     * The image url
     */
    imgUrl?: string;
}
