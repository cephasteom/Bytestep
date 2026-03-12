import { get } from "svelte/store";
import { probabilities, phases, circuit } from "./circuit/circuit";
import { data, type Note } from "./sequencers";
import { sequencers, divisions, bars } from "./";
import { scaleToRange, lerp, stretchIndex } from "$lib/utils";

type MappingOption = 'measure' | 'probability' | 'phase' | 'random' | 'constant'
type SonificationOptions = {
    strategy?: 'replace' | 'add', // replace existing notes, add to what's already there
    note?: MappingOption, // how to determine the pitch of the note
    noteRange?: [number, number], // range to scale pitch by - 0 - 127 for MIDI
    noteQuantize?: number, // quantize pitch to this many steps
    amp?: MappingOption, // how to determine the amplitude of the note
    ampRange?: [number, number], // range to scale amplitude by - 0 - 1 for MIDI velocity
    duration?: MappingOption, // how to determine the duration of the note
    durationRange?: [number, number], // range to scale duration by - in seconds
    trigger?: MappingOption, // how to determine which hits trigger notes
    triggerRange?: [number, number], // hits with trigger value outside this range are dropped
}

const defaults: SonificationOptions = {
    strategy: 'replace',
    note: 'constant',
    noteRange: [48, 72],
    noteQuantize: 1,
    amp: 'measure',
    ampRange: [0, 1],
    duration: 'constant',
    durationRange: [0.1, 1],
    trigger: 'measure',
    triggerRange: [0.5, 1],
}

const generateNoteValues = (
    s: number,
    hits: number,
    divsCount: number,
    measurements: number[][],
    pbs: number[],
    phs: number[],
    options: Required<Pick<SonificationOptions, 'note' | 'noteRange' | 'amp' | 'ampRange' | 'duration' | 'durationRange' | 'trigger' | 'triggerRange'>>
): Note[] => {
    const { noteRange, ampRange, durationRange, triggerRange } = options;
    const numQubits = measurements[0]?.length ?? 1;
    const si = s % numQubits;
    const notes: Note[] = [];

    for (let d = 0; d < hits; d++) {
        let triggerValue: number;
        switch (options.trigger) {
            case 'constant':    triggerValue = 1; break;
            case 'measure':     triggerValue = measurements[d][si]; break;
            case 'probability': triggerValue = stretchIndex(pbs, d, hits); break;
            case 'phase':       triggerValue = stretchIndex(phs, d, hits); break;
            case 'random':      triggerValue = Math.random(); break;
            default:            triggerValue = 1;
        }
        if (triggerValue < triggerRange[0] || triggerValue > triggerRange[1]) continue;

        let note: number;
        switch (options.note) {
            case 'constant':    note = noteRange[0]; break;
            case 'measure':     note = measurements[d][si] === 1 ? noteRange[1] : noteRange[0]; break;
            case 'probability': note = scaleToRange(stretchIndex(pbs, d, hits), noteRange); break;
            case 'phase':       note = scaleToRange(stretchIndex(phs, d, hits), noteRange); break;
            case 'random':      note = scaleToRange(Math.random(), noteRange); break;
            default:            note = noteRange[0];
        }

        let amp: number;
        switch (options.amp) {
            case 'constant':    amp = ampRange[0]; break;
            case 'measure':     amp = measurements[d][si] === 1 ? ampRange[1] : ampRange[0]; break;
            case 'probability': amp = lerp(stretchIndex(pbs, d, hits), ampRange); break;
            case 'phase':       amp = lerp(stretchIndex(phs, d, hits), ampRange); break;
            case 'random':      amp = lerp(Math.random(), ampRange); break;
            default:            amp = ampRange[0];
        }

        let duration: number;
        switch (options.duration) {
            case 'constant':    duration = durationRange[0]; break;
            case 'measure':     duration = measurements[d][si] === 1 ? durationRange[1] : durationRange[0]; break;
            case 'probability': duration = lerp(stretchIndex(pbs, d, hits), durationRange); break;
            case 'phase':       duration = lerp(stretchIndex(phs, d, hits), durationRange); break;
            case 'random':      duration = lerp(Math.random(), durationRange); break;
            default:            duration = durationRange[0];
        }

        notes.push({ position: d / divsCount, note, amp, duration });
    }

    return notes;
};

/**
 * Using the quantum circuit output, generate notes and populate the sequencers.
 * @param options
 */
export const sonify = (options: SonificationOptions = {}) => {
    const opts = { ...defaults, ...options } as Required<SonificationOptions>;

    const divsCount = get(divisions);
    const hits = divsCount * get(bars);

    const measurements: number[][] = Array.from({ length: hits }, () => {
        circuit.run();
        return circuit.measureAll();
    });

    const [pbs, phs, totalSequencers] = [
        get(probabilities),
        get(phases),
        get(sequencers)
    ];

    data.update(data => Object.fromEntries(
        Array.from({ length: totalSequencers }, (_, s) => [
            s,
            {
                record: false,
                muted: false,
                quantize: true,
                notes: [
                    ...(opts.strategy === 'add' ? data[s]?.notes ?? [] : []),
                    ...generateNoteValues(s, hits, divsCount, measurements, pbs, phs, opts as Required<Pick<SonificationOptions, 'note' | 'noteRange' | 'amp' | 'ampRange' | 'duration' | 'durationRange' | 'trigger' | 'triggerRange'>>),
                ],
                bytebeat: "t",
            }
        ])
    ))
};