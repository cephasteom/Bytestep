<script lang="ts">
    export let min: number = 0;
    export let max: number = 1;
    export let step: number = 0.01;
    export let value: [number, number] = [min, max];
    export let onChange: (value: [number, number]) => void = () => {};

    $: lo = value[0];
    $: hi = value[1];
    $: loPercent = ((lo - min) / (max - min)) * 100;
    $: hiPercent = ((hi - min) / (max - min)) * 100;

    const updateLo = (e: Event) => {
        const v = Math.min(+(e.target as HTMLInputElement).value, hi - step);
        onChange([v, hi]);
    };
    const updateHi = (e: Event) => {
        const v = Math.max(+(e.target as HTMLInputElement).value, lo + step);
        onChange([lo, v]);
    };
</script>

<div class="range-slider" style="--lo: {loPercent}%; --hi: {hiPercent}%;">
    <span class="bound">{lo.toFixed(step < 1 ? 2 : 0)}</span>
    <div class="track-wrap">
        <div class="track">
            <div class="fill"></div>
        </div>
        <input type="range" {min} {max} {step} value={lo} on:input={updateLo} />
        <input type="range" {min} {max} {step} value={hi} on:input={updateHi} />
    </div>
    <span class="bound">{hi.toFixed(step < 1 ? 2 : 0)}</span>
</div>

<style lang="scss">
    .range-slider {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
    }

    .bound {
        font-size: 0.75rem;
        color: var(--grey-lighter);
        width: 2.5rem;
        flex-shrink: 0;
        text-align: center;
    }

    .track-wrap {
        position: relative;
        flex: 1;
        height: 1.5rem;
        display: flex;
        align-items: center;
    }

    .track {
        position: absolute;
        width: 100%;
        height: 3px;
        background: var(--grey-darker);
        border-radius: 2px;

        .fill {
            position: absolute;
            left: var(--lo);
            right: calc(100% - var(--hi));
            height: 100%;
            background: white;
            border-radius: 2px;
        }
    }

    input[type="range"] {
        position: absolute;
        width: 100%;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        pointer-events: none;
        height: 100%;
        margin: 0;

        &::-webkit-slider-thumb {
            -webkit-appearance: none;
            pointer-events: all;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
        }

        &::-moz-range-thumb {
            pointer-events: all;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: white;
            cursor: pointer;
            border: none;
        }

        &::-webkit-slider-runnable-track { background: transparent; }
        &::-moz-range-track { background: transparent; }
    }
</style>
