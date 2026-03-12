<script lang="ts">
    import { showMappingSettings } from '$lib/stores/circuit/circuit';
    import { strategy, note, noteRange, amp, ampRange, duration, durationRange, trigger, triggerRange } from '$lib/stores/sonification';
    import Dialog from '$lib/components/Dialog.svelte';
    import RangeSlider from '$lib/components/RangeSlider.svelte';
    import Slider from '$lib/components/Slider.svelte';

    const mappingOptions = ['constant', 'measure', 'probability', 'phase', 'random'] as const;

    const ranges = {
        note:     { min: 0, max: 127, step: 1 },
        amp:      { min: 0, max: 1,   step: 0.01 },
        duration: { min: 0, max: 4,   step: 0.01 },
        trigger:  { min: 0, max: 1,   step: 0.01 },
    };
</script>

<Dialog bind:open={$showMappingSettings} title="Mapping Settings">
    <div class="settings">

        <div class="settings__row">
            <h3>Mapping Strategy</h3>
            <div class="radio-group">
                {#each ['replace', 'add'] as opt}
                    <label class="radio-pill" class:active={$strategy === opt}>
                        <input type="radio" bind:group={$strategy} value={opt} />
                        {opt}
                    </label>
                {/each}
            </div>
        </div>

        <div class="settings__row">
            <h3>Note</h3>
            <div class="settings__controls">
                <div class="radio-group">
                    {#each mappingOptions as opt}
                        <label class="radio-pill" class:active={$note === opt}>
                            <input type="radio" bind:group={$note} value={opt} />
                            {opt}
                        </label>
                    {/each}
                </div>
                {#if $note === 'constant'}
                    <Slider id="note" name="" {...ranges.note} value={$noteRange?.[0] ?? 48} onChange={v => noteRange.set([v, ranges.note.max])} />
                {:else}
                    <RangeSlider {...ranges.note} value={$noteRange ?? [48, 72]} onChange={v => noteRange.set(v)} />
                {/if}
            </div>
        </div>

        <div class="settings__row">
            <h3>Amplitude</h3>
            <div class="settings__controls">
                <div class="radio-group">
                    {#each mappingOptions as opt}
                        <label class="radio-pill" class:active={$amp === opt}>
                            <input type="radio" bind:group={$amp} value={opt} />
                            {opt}
                        </label>
                    {/each}
                </div>
                {#if $amp === 'constant'}
                    <Slider id="amp" name="" {...ranges.amp} value={$ampRange?.[0] ?? 0} onChange={v => ampRange.set([v, ranges.amp.max])} />
                {:else}
                    <RangeSlider {...ranges.amp} value={$ampRange ?? [0, 1]} onChange={v => ampRange.set(v)} />
                {/if}
            </div>
        </div>

        <div class="settings__row">
            <h3>Duration</h3>
            <div class="settings__controls">
                <div class="radio-group">
                    {#each mappingOptions as opt}
                        <label class="radio-pill" class:active={$duration === opt}>
                            <input type="radio" bind:group={$duration} value={opt} />
                            {opt}
                        </label>
                    {/each}
                </div>
                {#if $duration === 'constant'}
                    <Slider id="duration" name="" {...ranges.duration} value={$durationRange?.[0] ?? 0.1} onChange={v => durationRange.set([v, ranges.duration.max])} />
                {:else}
                    <RangeSlider {...ranges.duration} value={$durationRange ?? [0.1, 1]} onChange={v => durationRange.set(v)} />
                {/if}
            </div>
        </div>

        <div class="settings__row">
            <h3>Trigger</h3>
            <div class="settings__controls">
                <div class="radio-group">
                    {#each mappingOptions as opt}
                        <label class="radio-pill" class:active={$trigger === opt}>
                            <input type="radio" bind:group={$trigger} value={opt} />
                            {opt}
                        </label>
                    {/each}
                </div>
                {#if $trigger === 'constant'}
                    <Slider id="trigger" name="" {...ranges.trigger} value={$triggerRange?.[0] ?? 0.5} onChange={v => triggerRange.set([v, ranges.trigger.max])} />
                {:else}
                    <RangeSlider {...ranges.trigger} value={$triggerRange ?? [0.5, 1]} onChange={v => triggerRange.set(v)} />
                {/if}
            </div>
        </div>

    </div>
</Dialog>

<style lang="scss">
    .settings {
        display: flex;
        flex-direction: column;
        gap: 1.25rem;
        min-width: min(80vw, 36rem);

        h3 {
            padding-bottom: .5rem;
            border-bottom: 1px solid white;
        }

        &__controls {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            flex: 1;
        }
    }

    .radio-group {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
    }

    .radio-pill {
        display: flex;
        align-items: center;
        border-radius: 999px;
        border: 1px solid var(--grey-darker);
        cursor: pointer;
        color: var(--grey-lighter);
        transition: border-color 0.1s, color 0.1s, background-color 0.1s;

        input {
            display: none;
        }

        &.active {
            border-color: white;
            color: white;
            background-color: var(--grey-darker);
        }

        &:hover:not(.active) {
            border-color: var(--grey-lighter);
            color: white;
        }
    }
</style>
