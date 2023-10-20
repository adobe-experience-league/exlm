'use strict';

export function setLevels(val = 2) {
    const selectors = [];

    if (val > 6) {
        val = 6;
    }

    for (let i = val; i >= 1; i--) {
        selectors.push(`h${i + 1}:not(#lists-documentation)`);
    }

    return selectors.join(',');
}