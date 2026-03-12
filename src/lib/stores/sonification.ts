/**
 * This file contains the logic for sonifying the quantum circuit output.
 * It generates note data based on the measurements, probabilities, and phases of the circuit,
 * dependent on the user defined options for how to map these values to musical parameters like pitch, amplitude, duration, and trigger.
 * It then populates the sequencers with the generated notes according to the selected strategy (replace or add).
 */
import { get, writable } from "svelte/store";
import { probabilities, phases, circuit } from "./circuit/circuit";
import { data, type Note } from "./sequencers";
import { sequencers, divisions, bars } from "./";
import { scaleToRange, lerp, stretchIndex } from "$lib/utils";
import { persist } from "./localstorage";
import { scales } from "./scales";

type MappingOption = 'measure' | 'probability' | 'phase' | 'random' | 'constant'
export type SonificationOptions = {
    strategy?: 'replace' | 'add', // replace existing notes, add to what's already there
    note?: MappingOption, // how to determine the pitch of the note
    noteRange?: [number, number], // range to scale pitch by - 0 - 127 for MIDI
    noteQuantizeRoot?: number,       // root note 0–11 (C=0) for scale quantization
    noteQuantizeMode?: string | null, // scale name from scales.ts, null = no quantize
    amp?: MappingOption, // how to determine the amplitude of the note
    ampRange?: [number, number], // range to scale amplitude by - 0 - 1 for MIDI velocity
    duration?: MappingOption, // how to determine the duration of the note
    durationRange?: [number, number], // range to scale duration by - in seconds
    trigger?: MappingOption, // how to determine which hits trigger notes
    triggerRange?: [number, number], // hits with trigger value outside this range are dropped
}

export const defaults: SonificationOptions = {
    strategy: 'replace',
    note: 'random',
    noteRange: [48, 72],
    noteQuantizeRoot: 2,
    noteQuantizeMode: 'Dorian',
    amp: 'measure',
    ampRange: [0.5, 1],
    duration: 'constant',
    durationRange: [0.25, 2],
    trigger: 'measure',
    triggerRange: [0.5, 1],
}

export const strategy = writable<SonificationOptions['strategy']>(defaults.strategy)
strategy.subscribe(persist('bs.sonify.strategy'));
export const note = writable<SonificationOptions['note']>(defaults.note)
note.subscribe(persist('bs.sonify.note'));    
export const noteRange = writable<SonificationOptions['noteRange']>(defaults.noteRange)
noteRange.subscribe(persist('bs.sonify.noteRange'));
export const noteQuantizeRoot = writable<number>(defaults.noteQuantizeRoot!)
noteQuantizeRoot.subscribe(persist('bs.sonify.noteQuantizeRoot'));
export const noteQuantizeMode = writable<string | null>(defaults.noteQuantizeMode!)
noteQuantizeMode.subscribe(persist('bs.sonify.noteQuantizeMode'));
export const amp = writable<SonificationOptions['amp']>(defaults.amp)
amp.subscribe(persist('bs.sonify.amp'));
export const ampRange = writable<SonificationOptions['ampRange']>(defaults.ampRange)
ampRange.subscribe(persist('bs.sonify.ampRange'));
export const duration = writable<SonificationOptions['duration']>(defaults.duration)
duration.subscribe(persist('bs.sonify.duration'));
export const durationRange = writable<SonificationOptions['durationRange']>(defaults.durationRange)
durationRange.subscribe(persist('bs.sonify.durationRange'));
export const trigger = writable<SonificationOptions['trigger']>(defaults.trigger)
trigger.subscribe(persist('bs.sonify.trigger'));
export const triggerRange = writable<SonificationOptions['triggerRange']>(defaults.triggerRange)
triggerRange.subscribe(persist('bs.sonify.triggerRange'));

/**
 * Snap a note to the nearest pitch in a scale, transposed to root, then clamp to noteRange.
 * Checks the current octave plus adjacent octaves to handle boundary wrapping.
 */
const quantizeNote = (n: number, root: number, scale: number[], noteRange: [number, number]): number => {
    const octave = Math.floor((n - root) / 12);
    let best = n;
    let bestDist = Infinity;
    for (const octOffset of [-1, 0, 1]) {
        for (const degree of scale) {
            const candidate = root + (octave + octOffset) * 12 + degree;
            const dist = Math.abs(candidate - n);
            if (dist < bestDist) { bestDist = dist; best = candidate; }
        }
    }
    return Math.max(noteRange[0], Math.min(noteRange[1], best));
};

const generateNoteValues = (
    s: number,
    bars: number,
    divisions: number,
    measurements: number[][],
    pbs: number[],
    phs: number[],
    options: Required<Pick<SonificationOptions, 'note' | 'noteRange' | 'noteQuantizeRoot' | 'noteQuantizeMode' | 'amp' | 'ampRange' | 'duration' | 'durationRange' | 'trigger' | 'triggerRange'>>
): Note[] => {
    const { noteRange, ampRange, durationRange, triggerRange } = options;
    const quantizeScale = options.noteQuantizeMode ? scales[options.noteQuantizeMode] : null;
    const numQubits = measurements[0]?.length ?? 1;
    const si = s % numQubits;
    const notes: Note[] = [];
    const hits = bars * divisions;

    for (let d = 0; d < hits; d++) {
        
        // determine whether to trigger a note based on the selected option
        let triggerValue: number;
        switch (options.trigger) {
            case 'constant':    triggerValue = 1; break;
            case 'measure':     triggerValue = measurements[d][si]; break;
            case 'probability': triggerValue = stretchIndex(pbs, d, hits); break;
            case 'phase':       triggerValue = stretchIndex(phs, d, hits); break;
            case 'random':      triggerValue = Math.random(); break;
            default:            triggerValue = 1;
        }
        // if the trigger value is outside the specified range, skip this hit
        if (triggerValue < triggerRange[0] || triggerValue > triggerRange[1]) continue;

        // determine which note to play based on the selected option
        let note: number;
        switch (options.note) {
            case 'constant':    note = noteRange[0]; break;
            case 'measure':     note = measurements[d][si] === 1 ? noteRange[1] : noteRange[0]; break;
            case 'probability': note = scaleToRange(stretchIndex(pbs, d, hits), noteRange); break;
            case 'phase':       note = scaleToRange(stretchIndex(phs, d, hits), noteRange); break;
            case 'random':      note = scaleToRange(Math.random(), noteRange); break;
            default:            note = noteRange[0];
        }
        if (quantizeScale) note = quantizeNote(note, options.noteQuantizeRoot, quantizeScale, noteRange);

        // determine amplitude based on the selected option
        let amp: number;
        switch (options.amp) {
            case 'constant':    amp = ampRange[0]; break;
            case 'measure':     amp = measurements[d][si] === 1 ? ampRange[1] : ampRange[0]; break;
            case 'probability': amp = lerp(stretchIndex(pbs, d, hits), ampRange); break;
            case 'phase':       amp = lerp(stretchIndex(phs, d, hits), ampRange); break;
            case 'random':      amp = lerp(Math.random(), ampRange); break;
            default:            amp = ampRange[0];
        }

        // determine duration based on the selected option
        let duration: number;
        switch (options.duration) {
            case 'constant':    duration = durationRange[0]; break;
            case 'measure':     duration = measurements[d][si] === 1 ? durationRange[1] : durationRange[0]; break;
            case 'probability': duration = lerp(stretchIndex(pbs, d, hits), durationRange); break;
            case 'phase':       duration = lerp(stretchIndex(phs, d, hits), durationRange); break;
            case 'random':      duration = lerp(Math.random(), durationRange); break;
            default:            duration = durationRange[0];
        }

        // add the note to the array, with position determined by the current division
        notes.push({ position: d / divisions, note, amp, duration });
    }

    return notes;
};

/**
 * Using the quantum circuit output, generate notes and populate the sequencers.
 */
export const sonify = () => {
    const opts: Required<SonificationOptions> = {
        strategy:      get(strategy)      ?? defaults.strategy!,
        note:          get(note)          ?? defaults.note!,
        noteRange:     get(noteRange)     ?? defaults.noteRange!,
        noteQuantizeRoot: get(noteQuantizeRoot) ?? defaults.noteQuantizeRoot!,
        noteQuantizeMode: get(noteQuantizeMode) ?? defaults.noteQuantizeMode!,
        amp:           get(amp)           ?? defaults.amp!,
        ampRange:      get(ampRange)      ?? defaults.ampRange!,
        duration:      get(duration)      ?? defaults.duration!,
        durationRange: get(durationRange) ?? defaults.durationRange!,
        trigger:       get(trigger)       ?? defaults.trigger!,
        triggerRange:  get(triggerRange)  ?? defaults.triggerRange!,
    };

    const hits = get(divisions) * get(bars);

    const measurements: number[][] = Array.from({ length: hits }, () => {
        circuit.run();
        return circuit.measureAll();
    });

    const args = [
        get(bars),
        get(divisions),
        measurements,
        get(probabilities),
        get(phases),
        opts as Required<Pick<SonificationOptions, 'note' | 'noteRange' | 'noteQuantizeRoot' | 'noteQuantizeMode' | 'amp' | 'ampRange' | 'duration' | 'durationRange' | 'trigger' | 'triggerRange'>>
    ]

    data.update(data => Object.fromEntries(
        Array.from({ length: get(sequencers) }, (_, s) => [
            s,
            {
                record: false,
                muted: false,
                quantize: true,
                notes: [
                    ...(opts.strategy === 'add' ? data[s]?.notes ?? [] : []),
                    ...generateNoteValues(...[s, ...args] as Parameters<typeof generateNoteValues>),
                ],
                bytebeat: "t",
            }
        ])
    ))
};