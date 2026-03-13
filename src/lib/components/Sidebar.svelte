<script lang="ts">
    import { onMount } from "svelte";
    import { openMidiSettings, showMidiSettings } from '$lib/stores/midi';
    import { showSequencers } from "$lib/stores/sequencers";
    import { showCircuit } from "$lib/stores/circuit/circuit";
    import Button from "./Button.svelte";
    import SVG from "./SVG.svelte";

    const actions: (() => void)[] = [
        () => showSequencers.update(v => !v),
        () => showCircuit.update(v => !v),
        () => openMidiSettings()
    ]

    const button: { label: string, icon: string, action: () => void }[] = [
        { label: 'Step', icon: 'piano', action: () => showSequencers.update(v => !v) },
        { label: 'Qbts', icon: 'circuit', action: () => showCircuit.update(v => !v) },
        { label: 'MIDI', icon: 'midi', action: () => openMidiSettings() }
    ]

    onMount(() => {
        // use cmd/ctrl + 1, 2, 3 to toggle the sidebar buttons
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.metaKey || e.ctrlKey) {
                e.preventDefault();
                actions[parseInt(e.key) - 1]?.();
            }
        }
        window.addEventListener('keydown', handleKeyDown);
    
        return () => window.removeEventListener('keydown', handleKeyDown);
    });
</script>

<aside class="sidebar">
    {#each button as btn, i}
        <Button
            label={btn.label}
            padding={'0'}
            onClick={btn.action}
            isActive={[$showSequencers, $showCircuit, $showMidiSettings][i]}
        >
            <SVG type={btn.icon} width="2rem" />
        </Button>
    {/each}
</aside>

<style lang="scss">
    .sidebar {
        padding: 7.9rem var(--spacer) var(--spacer) var(--spacer);
        background-color: var(--black-lighter);
        min-height: calc(100vh - var(--header-height));
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        gap: 3rem;
    }
</style>