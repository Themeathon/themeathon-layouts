/* tslint:disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export interface Configschema {
  streamdeck: {
    enable: boolean;
    port: number;
    key: string;
    debug: boolean;
  };
  rabbitmq: {
    enable: boolean;
    protocol: string;
    hostname: string;
    username: string;
    password: string;
    vhost: string;
  };
  obs: {
    enable: boolean;
    address: string;
    password: string;
    names: {
      scenes: {
        ads: string;
        gameLayout: string;
        intermission: string;
      };
      groups: {
        gameCapture1: string;
        gameCapture2: string;
        gameCapture3: string;
        gameCapture4: string;
        cameraCapture1: string;
        cameraCapture2: string;
      };
    };
  };
  tracker: {
    enable: boolean;
    address: string;
    username: string;
    password: string;
    events: string | string[];
    /**
     * If the 'event' has multiple tracker events, this a 1-indexed value of which one is applicable to this stream from the events array.
     */
    streamEvent: number;
  };
  fcb: {
    enable: boolean;
    address: string;
    postKey: string;
  };
  mpd: {
    enable: boolean;
    address: string;
    port: number;
    volume: number;
  };
  tts: {
    enable: boolean;
    altVoiceAPI: string;
  };
  twitchExt: {
    enable: boolean;
    token: string;
  };
}