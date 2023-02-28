import { SubstrateEvent } from "@subql/types";

import {
    getEventData, unboundedQueryOptions
} from "./common";

import {Referendum} from "../types";
import {ReferendumProps} from "../types/models/Referendum";

export async function handleReferendumSubmission(event: SubstrateEvent): Promise<void> {
    const [index, track] = getEventData(event)

    const referendum = Referendum.create({
        id: index.toString(),
        trackId: Number(track.toString()),
        finished: false
    })

    await referendum.save()
}

/// We can handle all terminal events Approved/Rejected/Cancelled/Killed/TimedOut here because they have index as first arg
export async function handleTerminal(event: SubstrateEvent): Promise<void> {
    const [index] = getEventData(event)

    await markReferendumFinished(index.toString())
}

export async function getAllActiveReferendums(trackId: number): Promise<{ [id: string]: Referendum }> {
    const referendums = await getReferendumByTrackId(trackId)

    const activeReferendums: { [id: string]: Referendum } = {}

    for(var referendum of referendums) {
        if (!referendum.finished) {
            activeReferendums[referendum.id] = referendum
        }
    }

    return activeReferendums
}

async function getReferendumByTrackId(trackId: number): Promise<Referendum[] | undefined> {
    const records = await store.getByField('Referendum', 'trackId', trackId, unboundedQueryOptions);

    return records.map(record => Referendum.create(record as ReferendumProps));
}

async function markReferendumFinished(id: string): Promise<void> {
    const referendum = await Referendum.get(id)

    if (referendum == undefined) return

    referendum.finished = true

    await referendum.save()
}