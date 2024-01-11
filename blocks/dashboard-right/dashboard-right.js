import { getMetadata } from '../../scripts/lib-franklin.js';
import { adobeIMS } from '../../scripts/data-service/profile-service.js';
import decorateProfile  from './profile.js';

const isSignedIn = adobeIMS?.isSignedInUser();

/**
 * Dashboard Right decorator
 * @param {HTMLElement} dashboardRightBlock
 */

export default async function decorate(block) {
    if(getMetadata('theme') === 'dashboard,profile' && isSignedIn) {
        decorateProfile(block);
    }
}