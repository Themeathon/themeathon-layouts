/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-len */

declare module 'vuetify/es5/services/goto' {
  import Vue from 'vue';

  export default function goTo<T extends string | number | HTMLElement | Vue>(target: T, options?: any): any;
}
