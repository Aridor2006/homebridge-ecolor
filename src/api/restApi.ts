import axios, { AxiosInstance } from 'axios';
import { Logger } from 'homebridge';

const baseUrl = 'https://app.ecolorapi.com/';

export class EcolorApi {
  client: AxiosInstance;
  token?: string;

  constructor(
        private readonly log: Logger,
        private readonly email: string,
        private readonly password: string) {
    this.client = axios.create({
      baseURL: baseUrl,
    });
  }

  async login() {
    const { data, status } = await this.client.post<LoginResponse>('login', {
      cmd: 'login',
      email: this.email,
      password: this.password,
    });

    if (status !== 200 || data?.status !== 200) {
      this.log.debug('status: ', status);
      this.log.debug('inst', data?.status);
      this.log.error('Error signing in.');
      return;
    }

    this.token = data.data.token;
  }

  async getDevices() : Promise<Array<Device> | undefined> {
    if (this.token === undefined) {
      return undefined;
    }
    const {status, data} = await this.client.post<DeviceResponse>('devicelist', {
      cmd: 'get-device',
      token: this.token,
    });
    if (status !== 200 || data?.status !== 200) {
      this.log.error('Could not fetch devices');
      return undefined;
    }
    return data.data.device;
  }

}

type BaseResponse = {
    status: number;
};

type LoginResponse = BaseResponse & {
    data: {
        email: string;
        icon_url: string;
        md5_email: string;
        nick_name: string;
        token: string;
        user_id: number;
    };
};

type Device = {
            bleAdvName: string;
            email: string;
            guid: string;
            hwVersion: string;
            iconUrl: string;
            identifier: string;
            instructions: string;
            localUUID: string;
            mac: string;
            name: string;
            sku: string;
            swVersion: string;
            type: string;
            wifiName: string;
};

type DeviceResponse = BaseResponse & {
    data: {
        device: Array<Device>;
    };
};