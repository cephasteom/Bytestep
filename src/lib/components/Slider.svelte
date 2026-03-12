<script lang="ts">
    import { throttle, getDecimalPlaces } from "$lib/utils";

    export let min: number = 0;
    export let max: number = 100;
    export let showMinMax: boolean = true;
    export let step: number = 0.01;
    export let value: number = 50;
    export let id: string = "";
    export let colour: number = 1;
    export let name: string = "";
    export let onChange: (value: number) => void = () => {};
</script>

<div class="slider">
    {#if name}
        <label for={id}>{name}</label>
    {/if}
    <span 
        class="value"
        style:width={getDecimalPlaces(step) * 0.75 + 1.5 + "ch"}
        style="color: var(--theme-{colour});"
    >{value.toFixed(getDecimalPlaces(step))}</span>

    {#if showMinMax}
        <span class="min">{min}</span>
    {/if}
    <input 
        type="range" id={id} min={min} max={max} step={step} bind:value={value} class={"colour" + colour} 
        on:input={throttle(() => onChange(value), 10)}
    />
    {#if showMinMax}
        <span class="max">{max}</span>
    {/if}
</div>

<style lang="scss">
    .slider {
        display: flex;
        gap : 1rem;
        width: 100%;
    }
    label, span {
        color: white;
    }

    input {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        background: transparent;
        cursor: pointer;
        border-radius: 2px;

        &.colour1 {
            --colour-track: var(--theme-1);
        }
        &.colour2 {
            --colour-track: var(--theme-2);
        }
        &.colour3 {
            --colour-track: var(--theme-3);
        }
        &.colour4 {
            --colour-track: var(--theme-4);
        }
        &.colour5 {
            --colour-track: var(--theme-5);
        }
    }

    /* ===== Track ===== */
    input::-webkit-slider-runnable-track {
        height: 3px;
        background: var(--colour-track);
    }

    input::-moz-range-track {
        height: 3px;
        background: var(--colour-track);
    }

    /* ===== Thumb ===== */
    input::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 10px;
        width: 10px;
        border-radius: 50%;
        background: white;
        margin-top: -3.5px; /* centres thumb on track */
    }

    input::-moz-range-thumb {
        height: 10px;
        width: 10px;
        border-radius: 50%;
        background: white;
        border: none;
    }
</style>