import { PlatformConfig } from 'homebridge';


export interface PluginConfiguration extends PlatformConfig {
    username: string;
    password: string;
    url: string;
    mqttUrl: string;
    ca: string;
    clientCert: string;
    clientKey: string;

}

export const isPluginConfiguration = (x: PlatformConfig) : x is PluginConfiguration => {
  return true;
};