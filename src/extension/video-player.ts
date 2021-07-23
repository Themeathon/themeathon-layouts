import { VideoPlayer } from '@esa-layouts/types/schemas';
import type { Configschema } from '@esa-layouts/types/schemas/configschema';
import { Asset } from '@esamarathon/esa-layouts-shared/types';
import clone from 'clone';
import SpeedcontrolUtil from 'speedcontrol-util';
import { TwitchCommercialTimer } from 'speedcontrol-util/types/speedcontrol/schemas';
import { obsChangeScene } from './layouts'; // eslint-disable-line import/no-cycle
import { logVideoPlay } from './util/logging';
import { get as nodecg } from './util/nodecg';
import obs from './util/obs';
import { assetsVideos, obsData, videoPlayer } from './util/replicants';

const config = (nodecg().bundleConfig as Configschema);
const sc = new SpeedcontrolUtil(nodecg());

let index = 0;
let playlist: VideoPlayer['playlist'] = [];
let currVideo: Asset | null = null;

videoPlayer.value.playing = false;
videoPlayer.value.current = null;

// Set the upcoming intermission videos.
sc.on('timerStopped', () => {
  const run = sc.getCurrentRun();
  if (run?.customData.intermission) {
    // Creates a compiled list of what videos should be played and
    // where commercials should be played if needed.
    const splitList = run.customData.intermission.split(',');
    const formattedList: { name?: string, commercial: number }[] = [];
    for (let i = 0; i < splitList.length;) {
      if (splitList[i].startsWith('ad')) {
        const replaceStr = splitList[i].startsWith('adwait') ? 'adwait' : 'ad';
        const commercial = Number(splitList[i].replace(replaceStr, ''));
        if (commercial) {
          let name: string | undefined;
          if (!splitList[i].startsWith('adwait')) {
            name = splitList[i + 1];
            i += 2;
          } else {
            i += 1;
          }
          formattedList.push({ name, commercial });
        }
      } else {
        formattedList.push({ name: splitList[i], commercial: 0 });
        i += 1;
      }
    }

    // This filters out any items that have no asset *and* no commercial, which are useless.
    videoPlayer.value.playlist = formattedList.reduce<VideoPlayer['playlist']>(
      (prev, { name, commercial }) => {
        const asset = assetsVideos.value.find((v) => v.name === name?.trim());
        if (asset || commercial) prev.push({ sum: asset?.sum, commercial });
        return prev;
      },
      [],
    );

    nodecg().log.info('[Video Player] Automatically set playlist from run data');
  }
});

// Move this into below code?
videoPlayer.on('change', (newVal, oldVal) => {
  if (newVal.current && newVal.current !== oldVal?.current) {
    logVideoPlay(newVal.current);
  }
  if (!newVal.playing && oldVal?.playing) {
    // obsData.value.disableTransitioning = false;
  }
});

async function waitForCommercialEnd(): Promise<void> {
  if (sc.twitchCommercialTimer.value.secondsRemaining > 2
  && !obs.isCurrentScene(config.obs.names.scenes.intermission)) {
    await obsChangeScene({ scene: config.obs.names.scenes.intermission, force: true });
  }
  return new Promise((res, rej) => {
    if (sc.twitchCommercialTimer.value.secondsRemaining <= 0) res();
    else {
      const func = (val: TwitchCommercialTimer) => {
        if (!videoPlayer.value.playing) {
          rej();
        }
        if (val.secondsRemaining <= 0) {
          res();
          sc.twitchCommercialTimer.removeListener('change', func);
        }
      };
      sc.twitchCommercialTimer.on('change', func);
    }
  });
}

async function playNext(): Promise<void> {
  try {
    const commercialLength = playlist[index].commercial;
    if (commercialLength > 0) {
      await waitForCommercialEnd();
      sc.sendMessage('twitchStartCommercial', { duration: commercialLength });
    }
    const video = assetsVideos.value.find((v) => v.sum === playlist[index].sum);
    videoPlayer.value.current = video?.sum || null;
    if (video) {
      currVideo = clone(video);
      if (!obs.isCurrentScene(config.obs.names.scenes.videoPlayer)) {
        await obsChangeScene({ scene: config.obs.names.scenes.videoPlayer, force: true });
      }
      nodecg().sendMessage('playVideo', { url: video.url, ext: video.ext });
    } else {
      // This else block happens for both "commercial w/o video" and non-found assets.
      currVideo = null;
      if (commercialLength > 0) await waitForCommercialEnd();
      else await new Promise((res) => setTimeout(res, 2500));
      videoEnded(); // eslint-disable-line @typescript-eslint/no-use-before-define
    }
  } catch (err) {
    // catch
  }
}

export function startPlaylist(): void {
  obsData.value.disableTransitioning = true;
  videoPlayer.value.playing = true;
  index = 0;
  playlist = clone(videoPlayer.value.playlist);
  playNext();
}

function stopPlaylist(): void {
  index = 0;
  playlist.length = 0;
  currVideo = null;
  videoPlayer.value.playing = false;
  videoPlayer.value.current = null;
  obsData.value.disableTransitioning = false;
}

async function videoEnded(): Promise<void> {
  // Update play count if needed.
  if (currVideo) {
    if (!videoPlayer.value.plays[currVideo.sum]) {
      videoPlayer.value.plays[currVideo.sum] = 1;
    } else {
      videoPlayer.value.plays[currVideo.sum] += 1;
    }
  }
  if (playlist.length - 1 > index) {
    index += 1;
    playNext();
  } else {
    // End of playlist.
    stopPlaylist();
    videoPlayer.value.playlist.length = 0; // TEMP DISABLE FOR DEV
    if (!obs.isCurrentScene(config.obs.names.scenes.intermission)) {
      await obsChangeScene({ scene: config.obs.names.scenes.intermission, force: true });
    }
  }
}

export function stopEarly(): void {
  if (videoPlayer.value.playing) {
    stopPlaylist();
  }
}

// Used if a user manually switches to the video player scene in OBS.
nodecg().listenFor('startVideoPlayer', async () => {
  const asset = assetsVideos.value.find((v) => v.sum === videoPlayer.value.playlist[0]?.sum);
  if (!videoPlayer.value.playlist.length || !asset) {
    await new Promise((res) => setTimeout(res, 2 * 1000));
    if (!obs.isCurrentScene(config.obs.names.scenes.intermission)) {
      await obsChangeScene({ scene: config.obs.names.scenes.intermission, force: true });
    }
  }
  if (videoPlayer.value.playlist.length) {
    startPlaylist();
  }
});

// Triggered when a video ends playback in the browser.
nodecg().listenFor('videoEnded', videoEnded);

// Triggered from the video player control to stop early.
nodecg().listenFor('stopVideoPlayerEarly', () => {
  stopEarly();
  if (!obs.isCurrentScene(config.obs.names.scenes.intermission)) {
    obsChangeScene({ scene: config.obs.names.scenes.intermission, force: true });
  }
});