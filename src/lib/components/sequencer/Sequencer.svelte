<script lang="ts">
    import { activeSequencers, updateNoteAmp, updateNoteDuration } from "$lib/stores/sequencers";
    import { sequencerTs } from '$lib/stores/transport';
    import { data, addNote, removeNote, moveNote, notes, happensWithin, divisionToPosition } from "$lib/stores/sequencers";
    import { bars, divisions } from "$lib/stores/";
    import Cell from "./Cell.svelte";
    import { onMount } from "svelte";
    import Header from "./SequencerHeader.svelte";
    import Progress from "./SequencerProgress.svelte";
    import Meta from "./SequencerMeta.svelte";

    export let id: number;
    let currentNote = -1;
    let mouseIsDown = false;
    let startDivision = -1;
    let startNote = -1;
    let currentCell = {division: -1, note: -1};
    let scrollableDiv: HTMLDivElement;
    let selectedNotes = new Set<string>();

    type HistoryEntry =
        | { type: 'add'; position: number; note: number }
        | { type: 'remove'; entries: { position: number; note: number; amp: number; duration: number }[] }
        | { type: 'move'; moves: { fromPos: number; fromNote: number; toPos: number; toNote: number }[] };

    let history: HistoryEntry[] = [];

    const cellKey = (d: number, n: number) => `${d}:${n}`;
    const cellHasNote = (d: number, n: number) => $data[id].notes.some(note => happensWithin(d, note.position) && note.note === n);

    const handleMouseDown = (divisionIndex: number, noteIndex: number, event: MouseEvent) => {
        const key = cellKey(divisionIndex, noteIndex);
        const hasNote = cellHasNote(divisionIndex, noteIndex);

        if (event.shiftKey) {
            if (hasNote) {
                if (selectedNotes.has(key)) selectedNotes.delete(key);
                else selectedNotes.add(key);
                selectedNotes = selectedNotes;
            }
            return;
        }

        if (hasNote) {
            if (!selectedNotes.has(key)) {
                selectedNotes = new Set([key]);
            }
        } else {
            selectedNotes = new Set();
        }

        mouseIsDown = true;
        startDivision = divisionIndex;
        startNote = noteIndex;
    };

    const handleMouseUp = (divisionIndex: number, noteIndex: number) => {
        if (!mouseIsDown) return;

        if (startDivision === divisionIndex && startNote === noteIndex) {
            const position = divisionToPosition(divisionIndex);
            addNote(id, position, noteIndex);
            history = [...history, { type: 'add', position, note: noteIndex }];
            selectedNotes = new Set([cellKey(divisionIndex, noteIndex)]);
        } else {
            const dDiv = divisionIndex - startDivision;
            const dNote = noteIndex - startNote;

            if (selectedNotes.size > 0) {
                const moves: HistoryEntry & { type: 'move' } = { type: 'move', moves: [] };
                selectedNotes.forEach(key => {
                    const [d, n] = key.split(':').map(Number);
                    moves.moves.push({ fromPos: divisionToPosition(d), fromNote: n, toPos: divisionToPosition(d + dDiv), toNote: n + dNote });
                    moveNote(id, divisionToPosition(d), n, divisionToPosition(d + dDiv), n + dNote);
                });
                history = [...history, moves];
                selectedNotes = new Set([...selectedNotes].map(key => {
                    const [d, n] = key.split(':').map(Number);
                    return cellKey(d + dDiv, n + dNote);
                }));
            } else {
                const fromPos = divisionToPosition(startDivision);
                const toPos = divisionToPosition(divisionIndex);
                moveNote(id, fromPos, startNote, toPos, noteIndex);
                history = [...history, { type: 'move', moves: [{ fromPos, fromNote: startNote, toPos, toNote: noteIndex }] }];
            }
        }

        startDivision = -1;
        startNote = -1;
        mouseIsDown = false;
        currentCell = { division: divisionIndex, note: noteIndex };
    }

    const handleMouseLeave = () => {
        startDivision = -1;
        startNote = -1;
        currentNote = -1;
        mouseIsDown = false;
    };

    const handleMouseFocus = (divisionIndex: number, noteIndex: number) => {
        currentCell = { division: divisionIndex, note: noteIndex };
    };

    const handlePianoKeyClick = (noteIndex: number) => {
        const newSelected = new Set<string>();
        for (let d = 0; d < $divisions * $bars; d++) {
            if ($data[id].notes.some(n => happensWithin(d, n.position) && n.note === noteIndex)) {
                newSelected.add(cellKey(d, noteIndex));
            }
        }
        selectedNotes = newSelected;
    };

    $: collapsed = !$activeSequencers.includes(id);
    $: colour = `var(--theme-${(id % 5) + 1})`;
    $: minWidth = $bars * $divisions * 40 + "px";
    
    onMount(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (currentCell.division === -1 || currentCell.note === -1) return;

            // cmd+z / ctrl+z: undo
            if ((event.metaKey || event.ctrlKey) && event.key === "z") {
                event.preventDefault();
                const entry = history[history.length - 1];
                if (!entry) return;
                history = history.slice(0, -1);
                selectedNotes = new Set();
                if (entry.type === 'add') {
                    removeNote(id, entry.position, entry.note);
                } else if (entry.type === 'remove') {
                    entry.entries.forEach(({ position, note, amp, duration }) => {
                        addNote(id, position, note);
                        updateNoteAmp(id, position, note, amp);
                        updateNoteDuration(id, position, note, duration);
                    });
                } else if (entry.type === 'move') {
                    entry.moves.forEach(({ fromPos, fromNote, toPos, toNote }) => {
                        moveNote(id, toPos, toNote, fromPos, fromNote);
                    });
                }
                return;
            }

            // cmd+a / ctrl+a: select all notes
            if ((event.metaKey || event.ctrlKey) && event.key === "a") {
                event.preventDefault();
                selectedNotes = new Set(
                    $data[id].notes.flatMap(n => {
                        for (let d = 0; d < $divisions * $bars; d++) {
                            if (happensWithin(d, n.position)) return [cellKey(d, n.note)];
                        }
                        return [];
                    })
                );
                return;
            }

            // if backspace or delete is pressed, remove all selected notes (or current cell if none selected)
            if (event.key === "Backspace" || event.key === "Delete") {
                const toDelete = selectedNotes.size > 0
                    ? [...selectedNotes].map(key => { const [d, n] = key.split(':').map(Number); return { d, n }; })
                    : [{ d: currentCell.division, n: currentCell.note }];

                const entries = toDelete.flatMap(({ d, n }) => {
                    const position = divisionToPosition(d);
                    const stored = $data[id].notes.find(note => happensWithin(d, note.position) && note.note === n);
                    return stored ? [{ position, note: n, amp: stored.amp, duration: stored.duration }] : [];
                });

                if (entries.length) {
                    history = [...history, { type: 'remove', entries }];
                    entries.forEach(({ position, note }) => removeNote(id, position, note));
                    selectedNotes = new Set();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        let hasScrolled = false;
        const cancelActiveSequencerSubscription = activeSequencers.subscribe(ids => {
            if (!scrollableDiv || hasScrolled) return;
            if (!ids.includes(id)) return scrollableDiv.scrollTo({ top: 0 }); // scroll to top when deactivated

            // scroll to highest note when activated
            const highestNote = $data[id].notes.reduce((max, n) => n.note > max ? n.note : max, 0 );
            scrollableDiv.scrollTo({
                top: ((16 + 2) * (notes - highestNote)),
            });

            hasScrolled = true;
        });

        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            cancelActiveSequencerSubscription();
        };
    });
</script>

<section 
    class="sequencer" 
    class:sequencer--collapsed={collapsed}
    style="border-color: {colour};"
>
    <Header {id} {colour} />

    {#if collapsed}
        <Progress {id} {colour} />
    {/if}

    <div 
        class="sequencer__scrollable"
        tabindex="-1"
        bind:this={scrollableDiv}
    >
        <div class="sequencer__piano">
            {#each Array(notes) as _, noteIndex}
                <button
                    class="sequencer__piano-key"
                    style="grid-row: {(notes - noteIndex) + 1};"
                    class:sequencer__piano-key--accidental={[1, 3, 6, 8, 10].includes(noteIndex % 12)}
                    class:sequencer__piano-key--active={noteIndex === currentNote}
                    on:click={() => handlePianoKeyClick(noteIndex)}
                >{!(noteIndex % 12) ? `C${Math.floor(noteIndex / 12)}` : ''}</button>
            {/each}
        </div>
        
        <div 
            class="sequencer__grid"
            role="application"
            on:mouseleave={handleMouseLeave}
            style="min-width: {minWidth};"
        >
            {#each Array($divisions * $bars) as _, divisionIndex}
                {#each Array(notes) as _, noteIndex}
                    <Cell
                        division={divisionIndex}
                        note={noteIndex}
                        row={(notes - noteIndex) + 1}
                        on={$data[id].notes.some(n => happensWithin(divisionIndex, n.position) && n.note === noteIndex)}
                        focused={currentCell.division === divisionIndex && currentCell.note === noteIndex}
                        selected={selectedNotes.has(cellKey(divisionIndex, noteIndex))}
                        active={$sequencerTs[id] !== -1 && $sequencerTs[id] % ($divisions * $bars) === divisionIndex}
                        handleMouseOver={() => currentNote = noteIndex}
                        handleMouseDown={handleMouseDown}
                        handleMouseUp={handleMouseUp}
                        handleMouseFocus={handleMouseFocus}
                        {mouseIsDown}
                        colour={colour}
                    />
                {/each}
            {/each}
        </div>

    </div>
    {#if selectedNotes.size === 1 && (currentCell.division !== -1 && currentCell.note !== -1)}
        <Meta 
            {id}
            amp={$data[id].notes.find(n => n.position === divisionToPosition(currentCell.division) && n.note === currentCell.note)?.amp || 0.75}
            dur={$data[id].notes.find(n => n.position === divisionToPosition(currentCell.division) && n.note === currentCell.note)?.duration || 0.75}
            onChangeAmp={amp => updateNoteAmp(id, divisionToPosition(currentCell.division), currentCell.note, amp)}
            onChangeDur={duration => updateNoteDuration(id, divisionToPosition(currentCell.division), currentCell.note, duration)}
        />
    {/if}
</section>

<style lang="scss">
    .sequencer {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background-color: var(--black-lighter);
        padding: 1rem var(--spacer);
        border-radius: var(--border-radius);
        border: 1.5px solid;
        max-height: 20rem;
        transition: max-height 0.2s ease;
        overflow: scroll;
        position: relative;

        &--collapsed {
            max-height: 60px; // header height;
            overflow: hidden;
        }

        &__scrollable {
            box-sizing: border-box;
            display: grid;
            grid-template-columns: auto 1fr;
            overflow: scroll;
        }

        &__piano {
            display: grid;
            gap: 2px;
            grid-template-columns: 1fr;
            width: 3rem;
            margin-top: -3px;
            
            &-key {
                border: none;
                background-color: var(--grey-lighter);
                border-right: 3px solid var(--black-lighter);
                box-sizing: border-box;
                height: 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.625rem;
                color: white;
                cursor: pointer;
                
                &--accidental {
                    background-color: var(--grey-darker);
                }

                &--active {
                    background-color: rgba(255, 255, 255, 0.5);
                }

                &:focus {
                    outline: none;
                }
            }
        }
        &__grid {
            display: grid;
            gap: 3px;
            grid-template-columns: repeat(calc(get(divisions) * get(bars)), 1fr);
            grid-template-rows: repeat(notes, .5fr);
            margin-top: -3px;
            position: relative;
        }
    }
</style>