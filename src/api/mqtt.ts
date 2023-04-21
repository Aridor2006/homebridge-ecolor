import { Logger } from 'homebridge';
import mqtt, { IClientOptions, MqttClient } from 'mqtt';
import { PluginConfiguration } from '../config';
import { EOL } from 'os';

export class EcolorMqtt {
  client?: MqttClient;

  constructor(
    private readonly log: Logger,
    config: PluginConfiguration,
    private readonly appTopic: string,
    private readonly devTopic: string,
    private readonly setOn: (on: boolean) => void,
    private readonly setBrightness: (brightness: number) => void,
  ) {

    const opts: IClientOptions = {
      port: 8883,
      ca: this.formatCert(config.ca),
      cert: this.formatCert(config.clientCert),
      key: this.formatCert(config.clientKey),
    };

    try {
      this.log.debug('Creating mqtt');
      this.client = mqtt.connect(config.mqttUrl, opts);
      this.client.on('message', (topic, message) => this.onMessage(topic, message));
      this.client.on('connect', () => this.onConnect());
    } catch (ex) {
      this.log.error('err: ', ex);
    }
  }

  formatCert(cert:string):string {
    const certRegex = '(--.*?BEGIN.*?-) (.*) (--.*?END.*?-$)';
    const caMatches = cert.match(certRegex);
    if (!caMatches) {
      throw('Certificate missing.');
    }
    return `${caMatches[1]}${EOL}${caMatches[2].replace(/ /g, EOL)}${EOL}${caMatches[3]}`;
  }

  onMessage(topic: string, message: Buffer): void {
    this.log.debug('New message: ', message.toString());
    const msg: MqttMessage = JSON.parse(message.toString());
    const innerMsg = Buffer.from(msg.msg, 'base64');
    this.log.debug('x', innerMsg.at(0));
    this.log.debug('x', innerMsg[1]);
    this.log.debug('x', innerMsg[2]);
    if (innerMsg[0] === 51 || innerMsg[0] === 170) {
      if (innerMsg[1] === 1) {
        this.setOn(innerMsg[2] === 1);
      } else if (innerMsg[1] === 3) {
        this.setBrightness(innerMsg[2]);
      }
    }
  }

  cleanup() {
    this.log.debug('Closing mqtt con.');
    this.client?.end();
  }

  onConnect(): void {
    this.log.debug('CONNEFTRT');
    this.client?.subscribe(this.appTopic,
      (err) => this.onSubscribed(err));
  }

  onSubscribed(err: Error) {
    if (err) {
      this.log.error('Could not subscript to topic', err);
      this.cleanup();
      return;
    }

    this.sendMessage(Command.OnStatus);
    this.sendMessage(Command.GetBrightness);
  }

  sendMessage(cmd: Command | string) {
    this.client?.publish(this.devTopic, `{"msg":"${cmd}"}`);
  }
}

export enum Command {
  OnStatus = 'MwE=',
  On = 'qgEBAAAAAAAAAAAAAAAAAAAAAAA=',
  Off = 'qgEAAAAAAAAAAAAAAAAAAAAAAAA=',
  GetBrightness = 'MwM='
}

interface MqttMessage {
  msg: string;
}

