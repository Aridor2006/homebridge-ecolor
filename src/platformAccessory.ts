import { Service, PlatformAccessory, CharacteristicValue } from 'homebridge';

import { EcolorHomebridgePlatform } from './platform';
import { Command, EcolorMqtt } from './api/mqtt';

import crypto from 'crypto';

/**
 * Platform Accessory
 * An instance of this class is created for each accessory your platform registers
 * Each accessory may expose multiple services of different service types.
 */
export class EcolorPlatformAccessory {
  private service: Service;

  /**
   * These are just used to create a working example
   * You should implement your own code to track the state of your accessory
   */
  private exampleStates = {
    On: false,
    Brightness: 100,
  };

  client: EcolorMqtt;

  constructor(
    private readonly platform: EcolorHomebridgePlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    if (!this.platform.config) {
      throw('Config not loaded.');
    }
    const accountHash = crypto.createHash('md5').update(accessory.context.device.email).digest('hex').toUpperCase();
    const baseTopic = `${accessory.context.device.sku}/${accountHash}/${accessory.context.device.guid}`;
    this.client = new EcolorMqtt(this.platform.log,
      this.platform.config,
      `${baseTopic}/TOAPP`,
      `${baseTopic}/TODEV`,
      (on) => this.service.updateCharacteristic(this.platform.Characteristic.On, on),
      (brightness) => this.service.updateCharacteristic(this.platform.Characteristic.Brightness, brightness),
    );
    // set accessory information
    this.accessory.getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, 'Default-Manufacturer')
      .setCharacteristic(this.platform.Characteristic.Model, 'Default-Model')
      .setCharacteristic(this.platform.Characteristic.SerialNumber, 'Default-Serial');

    // get the LightBulb service if it exists, otherwise create a new LightBulb service
    // you can create multiple services for each accessory
    this.service = this.accessory.getService(this.platform.Service.Lightbulb) || this.accessory.addService(this.platform.Service.Lightbulb);

    // set the service name, this is what is displayed as the default name on the Home app
    // in this example we are using the name we stored in the `accessory.context` in the `discoverDevices` method.
    this.service.setCharacteristic(this.platform.Characteristic.Name, accessory.context.device.bleAdvName);

    // each service must implement at-minimum the "required characteristics" for the given service type
    // see https://developers.homebridge.io/#/service/Lightbulb

    // register handlers for the On/Off Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.On)
      .onSet(this.setOn.bind(this))                // SET - bind to the `setOn` method below
      // .onGet(this.getOn.bind(this));               // GET - bind to the `getOn` method below
    ;

    // register handlers for the Brightness Characteristic
    this.service.getCharacteristic(this.platform.Characteristic.Brightness)
      .onSet(this.setBrightness.bind(this));       // SET - bind to the 'setBrightness` method below

  }

  cleanup() {
    this.client?.cleanup();
  }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, turning on a Light bulb.
   */
  async setOn(value: CharacteristicValue) {
    // implement your own code to turn your device on/off
    this.exampleStates.On = value as boolean;

    if (value as boolean === true) {
      this.client.sendMessage(Command.On);
    } else {
      this.client.sendMessage(Command.Off);
    }

    this.platform.log.debug('Set Characteristic On ->', value);
  }

  /**
   * Handle the "GET" requests from HomeKit
   * These are sent when HomeKit wants to know the current state of the accessory, for example, checking if a Light bulb is on.
   *
   * GET requests should return as fast as possbile. A long delay here will result in
   * HomeKit being unresponsive and a bad user experience in general.
   *
   * If your device takes time to respond you should update the status of your device
   * asynchronously instead using the `updateCharacteristic` method instead.

   * @example
   * this.service.updateCharacteristic(this.platform.Characteristic.On, true)
   */
  // async getOn(): Promise<CharacteristicValue> {
  //   // implement your own code to check if the device is on
  //   // const isOn = this.exampleStates.On;
  //   this.platform.log.debug('on is queried');
  //   // await this.client.readyPromise;
  //   const isOn = this.client.isOn;

  //   this.platform.log.debug('Get Characteristic On ->', isOn);

  //   // if you need to return an error to show the device as "Not Responding" in the Home app:
  //   // throw new this.platform.api.hap.HapStatusError(this.platform.api.hap.HAPStatus.SERVICE_COMMUNICATION_FAILURE);

  //   return isOn;
  // }

  /**
   * Handle "SET" requests from HomeKit
   * These are sent when the user changes the state of an accessory, for example, changing the Brightness
   */
  async setBrightness(value: CharacteristicValue) {
    // implement your own code to set the brightness
    this.exampleStates.Brightness = value as number;

    const msg = Buffer.from([170, 3, value as number]).toString('base64');
    this.platform.log.debug('Sendin bring ', msg);
    this.client.sendMessage(msg);

    this.platform.log.debug('Set Characteristic Brightness -> ', value);
  }

}
