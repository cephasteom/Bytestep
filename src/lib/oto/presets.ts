export type Preset = {
    type: 'synth' | 'sampler'
    label: string
    params: Record<string, number>
    pitched?: boolean
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
        label: 'Drum 808',
        params: { bank: '808' },
        pitched: false
    },
    blip: {
        type: 'sampler',
        label: 'Blip',
        params: { bank: 'blip' }
    },
    arpy: {
        type: 'sampler',
        label: 'Arpy',
        params: { bank: 'arpy' }
    },
    kick: {
        type: 'sampler',
        label: 'Kick 808',
        params: { bank: '808bd' },
        pitched: false
    },
    snare: {
        type: 'sampler',
        label: 'Snare 808',
        params: { bank: 'sd808' },
        pitched: false
    },
    hihat: {
        type: 'sampler',
        label: 'HiHat 808',
        params: { bank: 'hh' },
        pitched: false
    },
    tabla: {
        type: 'sampler',
        label: 'Tabla',
        params: { bank: 'tabla' }
    },
    jvbass: {
        type: 'sampler',
        label: 'JVBass',
        params: { bank: 'jvbass' }
    },
    clap: {
        type: 'sampler',
        label: 'Clap',
        params: { bank: 'clap808' },
        pitched: false
    },
    cymbal: {
        type: 'sampler',
        label: 'Cymbal',
        params: { bank: 'cy808' },
        pitched: false
    },
    stab: {
        type: 'sampler',
        label: 'Stab',
        params: { bank: 'stab' }
    },
    fm: {
        type: 'sampler',
        label: 'Drum Loop F',
        params: { bank: 'fm' }
    },
    jazz: {
        type: 'sampler',
        label: 'Drum Loop J',
        params: { bank: 'jazz' }
    },
    industrial: {
        type: 'sampler',
        label: 'Industrial',
        params: { bank: 'industrial' },
        pitched: false
    },
}

export const PRESET_KEYS = Object.keys(PRESETS)
