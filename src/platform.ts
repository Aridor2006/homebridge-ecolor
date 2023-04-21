import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { EcolorPlatformAccessory } from './platformAccessory';
import { PluginConfiguration, isPluginConfiguration } from './config';
import { EcolorApi } from './api/restApi';

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class EcolorHomebridgePlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;
  public readonly config?: PluginConfiguration;
  private readonly devices: Array<EcolorPlatformAccessory>;

  // this is used to track restored cached accessories
  public readonly accessories: PlatformAccessory[] = [];
  ecolorApi?: EcolorApi;

  constructor(public readonly log: Logger,
    config: PlatformConfig,
    public readonly api: API,
  ) {
    this.devices = [];

    if (isPluginConfiguration(config)) {
      this.config = config;
    }

    if (!this.config) {
      return;
    }

    this.ecolorApi = new EcolorApi(log, this.config.username, this.config.password);
    this.api.on('didFinishLaunching', () => this.pluginSetup());
    this.api.on('shutdown', () => this.cleanup());
  }

  private async cleanup() {
    this.log.debug('shutdown');
    for (const device of this.devices) {
      device.cleanup();
    }
  }

  private async pluginSetup() {
    this.log.debug('pluginsetup');
    this.log.debug('restored accessories: ', this.accessories.length);

    this.log.debug('x: ', this.accessories[0].context.device);


    if (this.ecolorApi !== undefined) {
      await this.ecolorApi.login();
      const devices = await this.ecolorApi.getDevices();
      if (devices === undefined || devices.length === undefined) {
        this.log.error('Error fetching devices.');
        return;
      }
      for (const device of devices) {
        const uuid = this.api.hap.uuid.generate(device.guid);
        const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);
        if (existingAccessory) {
          this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
          // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
          // existingAccessory.context.device = device;
          // this.api.updatePlatformAccessories([existingAccessory]);

          // create the accessory handler for the restored accessory
          // this is imported from `platformAccessory.ts`
          this.devices.push(new EcolorPlatformAccessory(this, existingAccessory));

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
        } else {
        // the accessory does not yet exist, so we need to create it
          this.log.info('Adding new accessory:', device.bleAdvName);

          // create a new accessory
          const accessory = new this.api.platformAccessory(device.bleAdvName, uuid);

          // store a copy of the device object in the `accessory.context`
          // the `context` property can be used to store any data about the accessory you may need
          accessory.context.device = device;

          // create the accessory handler for the newly create accessory
          // this is imported from `platformAccessory.ts`
          this.devices.push(new EcolorPlatformAccessory(this, accessory));

          // link the accessory to your platform
          this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
        }
      }
    }

  }


  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: PlatformAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  discoverDevices() {

    // EXAMPLE ONLY
    // A real plugin you would discover accessories from the local network, cloud services
    // or a user-defined array in the platform config.
    const exampleDevices = [
      {
        exampleUniqueId: 'ABCD',
        exampleDisplayName: 'Bedroom',
      },
      {
        exampleUniqueId: 'EFGH',
        exampleDisplayName: 'Kitchen',
      },
    ];

    // loop over the discovered devices and register each one if it has not already been registered
    for (const device of exampleDevices) {

      // generate a unique id for the accessory this should be generated from
      // something globally unique, but constant, for example, the device serial
      // number or MAC address
      const uuid = this.api.hap.uuid.generate(device.exampleUniqueId);

      // see if an accessory with the same uuid has already been registered and restored from
      // the cached devices we stored in the `configureAccessory` method above
      const existingAccessory = this.accessories.find(accessory => accessory.UUID === uuid);

      if (existingAccessory) {
        // the accessory already exists
        this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);

        // if you need to update the accessory.context then you should run `api.updatePlatformAccessories`. eg.:
        // existingAccessory.context.device = device;
        // this.api.updatePlatformAccessories([existingAccessory]);

        // create the accessory handler for the restored accessory
        // this is imported from `platformAccessory.ts`
        new EcolorPlatformAccessory(this, existingAccessory);

        // it is possible to remove platform accessories at any time using `api.unregisterPlatformAccessories`, eg.:
        // remove platform accessories when no longer present
        // this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [existingAccessory]);
        // this.log.info('Removing existing accessory from cache:', existingAccessory.displayName);
      } else {
        // the accessory does not yet exist, so we need to create it
        this.log.info('Adding new accessory:', device.exampleDisplayName);

        // create a new accessory
        const accessory = new this.api.platformAccessory(device.exampleDisplayName, uuid);

        // store a copy of the device object in the `accessory.context`
        // the `context` property can be used to store any data about the accessory you may need
        accessory.context.device = device;

        // create the accessory handler for the newly create accessory
        // this is imported from `platformAccessory.ts`
        new EcolorPlatformAccessory(this, accessory);

        // link the accessory to your platform
        this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      }
    }
  }
}
