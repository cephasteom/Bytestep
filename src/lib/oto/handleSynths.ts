import { writable, get } from "svelte/store"
import CtSampler from "./ct-synths/rnbo/Sampler"
import CtSynth from "./ct-synths/rnbo/Synth"
import type { Dictionary } from './types'
import { getOutput } from './routing'
import { samples } from './stores'
import { PRESETS } from './presets'

const synths = writable<Dictionary>({})

function getOrCreateInstrument(channel: number, type: string) {
    const store = get(synths)
    if (store[channel]?.[type]) return store[channel][type]

    const inst = type === 'sampler'
        ? new CtSampler()
        : new CtSynth({ lite: true })

    inst.connect(getOutput())
    if (type === 'sampler') inst.banks = get(samples)

    synths.update(obj => ({
        ...obj,
        [channel]: { ...obj[channel], [type]: inst }
    }))
    return inst
}

function mapNoteToSample(note: number, bankSize: number) {
    const zoneSize = 128 / bankSize
    const i = Math.min(Math.floor(note / zoneSize), bankSize - 1)
    const zoneCenter = (i * zoneSize) + (zoneSize / 2)
    const pitchOffset = note - zoneCenter
    return { i, n: 60 + pitchOffset }
}

export function handleSynthEvent(time: number, params: Dictionary) {
    const { n = 60, amp = 0.5, dur = 500, track = 0, preset = 'piano' } = params

    const config = PRESETS[preset] || PRESETS.piano
    const inst = getOrCreateInstrument(track, config.type)

    if (config.type === 'sampler') {
        const bankName = config.params.bank as unknown as string
        const bank = get(samples)[bankName]

        if (!bank) {
            console.warn(`Bank "${bankName}" not found for preset "${preset}".`)
            return
        }
        const { i, n: mappedNote } = mapNoteToSample(n, bank.length)
        inst.play({ ...config.params, n: mappedNote, amp, dur }, time)
    } else {
        inst.play({ ...config.params, n, amp, dur }, time)
    }
}

const updateBanks = (currentSynths: Dictionary) => {
    Object.values(currentSynths).forEach(channelSynths => {
        if (channelSynths?.sampler) {
            channelSynths.sampler.banks = { ...channelSynths.sampler.banks, ...get(samples) }
        }
    })
}
synths.subscribe(updateBanks)
samples.subscribe(() => updateBanks(get(synths)))
