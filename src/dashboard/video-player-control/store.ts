import clone from 'clone';
import type { ReplicantBrowser } from 'nodecg/types/browser';
import type { VideoPlayer } from 'schemas';
import type { Asset } from 'types';
import Vue from 'vue';
import Vuex, { Store } from 'vuex';

Vue.use(Vuex);

// Replicants and their types
const reps: {
  videoPlayer: ReplicantBrowser<VideoPlayer>;
  videos: ReplicantBrowser<Asset[]>;
  [k: string]: ReplicantBrowser<unknown>;
} = {
  videoPlayer: nodecg.Replicant('videoPlayer'),
  videos: nodecg.Replicant('assets:videos'),
};

// Types for mutations below
export type UpdateSelectedVideo = (sum?: string) => void;
export type UnselectVideo = () => void;

const store = new Vuex.Store({
  state: {},
  mutations: {
    setState(state, { name, val }): void {
      Vue.set(state, name, val);
    },
    /* Mutations to replicants start */
    updateSelectedVideo(state, sum): void {
      if (typeof reps.videoPlayer.value !== 'undefined') {
        reps.videoPlayer.value.selected = sum;
        /* if (!reps.videoPlayer.value.plays[sum]) {
          reps.videoPlayer.value.plays[sum] = 1;
        } else {
          reps.videoPlayer.value.plays[sum] += 1;
        } */
      }
    },
    unselectVideo(): void {
      if (typeof reps.videoPlayer.value !== 'undefined') {
        reps.videoPlayer.value.selected = undefined;
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
