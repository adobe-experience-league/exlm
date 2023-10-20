'use strict';

export function hashFragment(arg = '') {
    const url = new URL(location.href),
        lhash = arg.replace(/^#/, '');

    url.hash = lhash.length > 0 ? lhash : arg;
    history.replaceState({}, '', url.href);
}