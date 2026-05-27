import { start, getContext } from 'tone'
import { samples } from './stores'
import { handleSynthEvent } from './handleSynths'
import type { Dictionary } from './types'

let audioStarted = false

export async function initAudio() {
    if (audioStarted) return
    await start()
    getContext().lookAhead = 0.1
    audioStarted = true
}

export async function loadSamples() {
    let banks: Dictionary = {}

    // satori samples
    try {
        const json = await fetch('https://raw.githubusercontent.com/cephasteom/satori-samples/main/samples.json').then(r => r.json())
        const base = json._base || ''
        Object.entries(json)
            .filter(([k]) => k !== '_base')
            .forEach(([k, v]) => {
                banks[k] = (v as string[]).map(s => `${base}${s}`)
            })
    } catch (e) { console.warn('Could not load satori samples') }

    // tidal dirt samples
    try {
        const json = await fetch('https://raw.githubusercontent.com/tidalcycles/dirt-samples/main/strudel.json').then(r => r.json())
        const dirtBase = 'https://raw.githubusercontent.com/tidalcycles/Dirt-Samples/master/'
        Object.entries(json)
            .filter(([k]) => k !== '_base')
            .forEach(([k, v]) => {
                banks[k] = (v as string[]).map(s => `${dirtBase}${s}`)
            })
    } catch (e) { console.warn('Could not load dirt samples') }

    samples.set(banks)
    console.log('Available banks:', Object.keys(banks))
    console.log('Total banks:', Object.keys(banks).length)
}


// the function Bytestep's transport loop calls
export function triggerNote(
    track: number, note: number, amp: number, dur: number, time: number,
    preset: string = 'piano'
) {
    handleSynthEvent(time, { n: note, amp, dur, track, preset })
}
