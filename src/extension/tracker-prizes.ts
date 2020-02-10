/* eslint-disable import/prefer-default-export */

import { Configschema } from 'configschema';
import moment from 'moment';
import needle from 'needle';
import { FormattedPrize, Prize } from 'types';
import { eventInfo, getCookies } from './tracker';
import { get as nodecg } from './util/nodecg';
import { prizes } from './util/replicants';

const config = (nodecg().bundleConfig as Configschema).tracker;
const refreshTime = 60 * 1000; // Get prizes every 60s.

// Processes the response from the API above.
function processRawPrizes(rawPrizes: Prize[]): FormattedPrize[] {
  return rawPrizes.reduce((accumulator, prize) => {
    const formattedPrize = {
      id: prize.pk,
      name: prize.fields.name,
      provided: prize.fields.provider || 'Anonymous',
      minimumBid: parseFloat(prize.fields.minimumbid),
      image: prize.fields.image,
      startTimestamp: prize.fields.startrun__starttime || prize.fields.starttime,
      endTimestamp: prize.fields.endrun__endtime || prize.fields.endtime,
    };
    // Only add prize if applicable right now.
    const currentTimestamp = moment().unix();
    const startTimestamp = moment(formattedPrize.startTimestamp).unix();
    const endTimestamp = moment(formattedPrize.endTimestamp).unix();
    if (currentTimestamp > startTimestamp && currentTimestamp < endTimestamp) {
      accumulator.push(formattedPrize);
    }
    return accumulator;
  }, [] as FormattedPrize[]);
}

// Get the prizes from the API.
async function updatePrizes(): Promise<void> {
  try {
    const resp = await needle(
      'get',
      `https://${config.address}/search/?event=${eventInfo[0].id}&type=prize&state=ACCEPTED`,
      {
        cookies: getCookies(),
      },
    );
    const currentPrizes = processRawPrizes(resp.body);
    prizes.value = currentPrizes;
    setTimeout(updatePrizes, refreshTime);
  } catch (err) {
    nodecg().log.warn('[Tracker] Error updating prizes');
    nodecg().log.debug('[Tracker] Error updating prizes:', err);
    prizes.value.length = 0; // Clear the array so we do not display incorrect information.
    setTimeout(updatePrizes, refreshTime);
  }
}

export function setup(): void {
  updatePrizes();
}
