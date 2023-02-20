/* eslint-disable */
/**
 * This file was automatically generated by json-schema-to-typescript.
 * DO NOT MODIFY IT BY HAND. Instead, modify the source JSONSchema file,
 * and run json-schema-to-typescript to regenerate this file.
 */

export type Types = 'UpcomingRuns' | 'RandomBid' | 'RandomPrize' | 'Media';

export interface IntermissionSlides {
	rotation: {
		type: Types;
		id: string;
		mediaUUID: string;
	}[];
	current: {
		type: Types;
		id: string;
		mediaUUID: string;
		bidId?: number;
		prizeId?: number;
	} | null;
}