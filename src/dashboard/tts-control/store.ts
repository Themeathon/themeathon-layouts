import clone from 'clone';
import type { ReplicantBrowser } from 'nodecg/types/browser';
import type { TtsVoices } from 'schemas';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

Vue.use(Vuex);

// Replicants and their types
const reps: {
  voices: ReplicantBrowser<TtsVoices>;
  [k: string]: ReplicantBrowser<unknown>;
} = {
  voices: nodecg.Replicant('ttsVoices'),
};

// Types for mutations below
export type UpdateSelectedVoice = (code?: string) => void;

const store = new Vuex.Store({
  state: {},
  mutations: {
    setState(state, { name, val }): void {
      Vue.set(state, name, val);
    },
    /* Mutations to replicants start */
    updateSelectedVoice(state, code): void {
      if (typeof reps.voices.value !== 'undefined') {
        reps.voices.value.selected = code;
      }
    },
    /* Mutations to replicants end */
  },
});

Object.keys(reps).forEach((key) => {
  reps[key].on('change', (val) => {
    store.commit('setState', { name: key, val: clone(val) });
  });
});

export default async function (): Promise<Store<{}>> {
  return NodeCG.waitForReplicants(
    ...Object.keys(reps).map((key) => reps[key]),
  ).then(() => store);
}
