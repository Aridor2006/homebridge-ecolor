import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { EcolorHomebridgePlatform } from './platform';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, EcolorHomebridgePlatform);
};
