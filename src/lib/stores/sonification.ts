import { get } from "svelte/store";
import { probabilities, phases, circuit } from "./circuit/circuit";
import { data, type Note } from "./sequencers";
import { sequencers, divisions, bars } from "./";

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
    trigger: 'measure'
}

/**
 * Using the quantum circuit output, generate notes and populate the sequencers.
 * @param options 
 */
export const sonify = (options: SonificationOptions = {}) => {
    options = {
        ...defaults,
        ...options
    };

    const hits = get(divisions) * get(bars);

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
                    
                ],
                bytebeat: "t",
            }
        ])
    ))
};