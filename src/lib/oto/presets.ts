export type Preset = {
    type: 'synth' | 'sampler'
    label: string
    params: Record<string, number>
}

export const PRESETS: Record<string, Preset> = {
    piano: {
        type: 'synth',
        label: 'SatoriSynth',
        params: { osc: 0, modi: 1.5, harm: 1, a: 5, d: 300, s: 0.2, r: 400, cutoff: 6000, res: 0 }
    },
    fmbass: {
        type: 'synth',
        label: 'SatorySynthBass',
        params: { osc: 1, modi: 0.5, harm: 0.5, a: 5, d: 150, s: 0.6, r: 100, cutoff: 1500, res: 0.2 }
    },
    organ: {
        type: 'synth',
        label: 'SatoriSynthOrgan',
        params: { osc: 0, modi: 1, harm: 1, a: 10, d: 50, s: 0.9, r: 50, cutoff: 5000, res: 0 }
    },
    strings: {
        type: 'synth',
        label: 'SatoriSynthPad',
        params: { osc: 1, modi: 0.2, harm: 1, a: 300, d: 400, s: 0.7, r: 600, cutoff: 4000, res: 0 }
    },
    lead: {
        type: 'synth',
        label: 'Lead',
        params: { osc: 1, modi: 3, harm: 2, a: 5, d: 200, s: 0.5, r: 200, cutoff: 8000, res: 0.3 }
    },
    808: {
        type: 'sampler',
        label: '808',
        params: { bank: '808' }
    },
    blip: {
        type: 'sampler',
        label: 'Blip',
        params: { bank: 'blip' }
    },
    pluck: {
        type: 'sampler',
        label: 'Pluck',
        params: { bank: 'pluck' }
    },
    arpy: {
        type: 'sampler',
        label: 'Arpy',
        params: { bank: 'arpy' }
    },
}

export const PRESET_KEYS = Object.keys(PRESETS)
