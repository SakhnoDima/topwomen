import { fetchingDataFromBiontech } from './biontech.js';
import { fetchingDataFromEuroclear } from './euroclear.js';

export const CRAWLERS = {
    euroclear: fetchingDataFromEuroclear,
    biontech: fetchingDataFromBiontech,
};
