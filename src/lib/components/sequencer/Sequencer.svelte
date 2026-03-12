<script lang="ts">
    import { activeSequencers, sequencerHeights, updateNoteAmp, updateNoteDuration } from "$lib/stores/sequencers";
    import { sequencerTs } from '$lib/stores/transport';
    import { data, addNote, removeNote, moveNote, notes, happensWithin, divisionToPosition } from "$lib/stores/sequencers";
    import { createHistory, type HistoryEntry } from "./history";
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
    let hoverDivision = -1;
    let scrollableDiv: HTMLDivElement;
    let selectedNotes = new Set<string>();

    const history = createHistory(id);

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
            history.push({ type: 'add', position, note: noteIndex });
            selectedNotes = new Set([cellKey(divisionIndex, noteIndex)]);
        } else {
            const dDiv = divisionIndex - startDivision;
            const dNote = noteIndex - startNote;

            if (selectedNotes.size > 0) {
                const moves: HistoryEntry & { type: 'move' } = { type: 'move', moves: [] };
                [...selectedNotes]
                    .map(key => { const [d, n] = key.split(':').map(Number); return { d, n }; })
                    .sort((a, b) => dDiv !== 0 ? (b.d - a.d) * dDiv : (b.n - a.n) * dNote)
                    .forEach(({ d, n }) => {
                        moves.moves.push({ fromPos: divisionToPosition(d), fromNote: n, toPos: divisionToPosition(d + dDiv), toNote: n + dNote });
                        moveNote(id, divisionToPosition(d), n, divisionToPosition(d + dDiv), n + dNote);
                    });
                history.push(moves);
                selectedNotes = new Set([...selectedNotes].map(key => {
                    const [d, n] = key.split(':').map(Number);
                    return cellKey(d + dDiv, n + dNote);
                }));
            } else {
                const fromPos = divisionToPosition(startDivision);
                const toPos = divisionToPosition(divisionIndex);
                moveNote(id, fromPos, startNote, toPos, noteIndex);
                history.push({ type: 'move', moves: [{ fromPos, fromNote: startNote, toPos, toNote: noteIndex }] });
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
        hoverDivision = -1;
        mouseIsDown = false;
    };

    const handleGridMouseUp = (event: MouseEvent) => {
        // only handle mouseup on the gap between cells (not bubbled from a cell)
        if (event.target !== event.currentTarget) return;
        if (!mouseIsDown || hoverDivision === -1) return;
        handleMouseUp(hoverDivision, currentNote);
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
        const first = newSelected.values().next().value;
        if (first) { const [d, n] = first.split(':').map(Number); currentCell = { division: d, note: n }; }
    };

    $: collapsed = !$activeSequencers.includes(id);
    $: colour = `var(--theme-${(id % 5) + 1})`;
    $: minWidth = $bars * $divisions * 40 + "px";

    let resizing = false;
    let resizeStartY = 0;
    let resizeStartHeight = 0;

    const handleResizeStart = (e: MouseEvent) => {
        resizing = true;
        resizeStartY = e.clientY;
        resizeStartHeight = $sequencerHeights[id] || 320;
        e.preventDefault();
    };

    // keys for all notes that currently exist in the store
    $: existingNoteKeys = new Set($data[id].notes.flatMap(n => {
        for (let d = 0; d < $divisions * $bars; d++) {
            if (happensWithin(d, n.position)) return [cellKey(d, n.note)];
        }
        return [];
    }));

    // clean up selection and focus when external changes remove notes
    $: {
        existingNoteKeys;
        const filtered = new Set([...selectedNotes].filter(k => existingNoteKeys.has(k)));
        if (filtered.size !== selectedNotes.size) selectedNotes = filtered;
        if (currentCell.division !== -1 && !existingNoteKeys.has(cellKey(currentCell.division, currentCell.note))) {
            currentCell = { division: -1, note: -1 };
        }
    }
    $: ghostCells = mouseIsDown && selectedNotes.size > 0 && hoverDivision !== -1
        ? new Set([...selectedNotes].map(key => {
            const [d, n] = key.split(':').map(Number);
            return cellKey(d + (hoverDivision - startDivision), n + (currentNote - startNote));
          }))
        : new Set<string>();
    
    onMount(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (currentCell.division === -1 || currentCell.note === -1) return;

            // cmd+z / ctrl+z: undo
            if ((event.metaKey || event.ctrlKey) && event.key === "z") {
                event.preventDefault();
                if (history.undo()) selectedNotes = new Set();
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
                const first = selectedNotes.values().next().value;
                if (first) { const [d, n] = first.split(':').map(Number); currentCell = { division: d, note: n }; }
                return;
            }

            // arrow keys: move selected notes
            if (selectedNotes.size > 0 && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
                event.preventDefault();
                const dDiv = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
                const dNote = event.key === "ArrowUp" ? 1 : event.key === "ArrowDown" ? -1 : 0;
                const sorted = [...selectedNotes]
                    .map(key => { const [d, n] = key.split(':').map(Number); return { d, n }; })
                    .sort((a, b) => dDiv !== 0 ? (b.d - a.d) * dDiv : (b.n - a.n) * dNote);
                const moves: { fromPos: number; fromNote: number; toPos: number; toNote: number }[] = [];
                sorted.forEach(({ d, n }) => {
                    moves.push({ fromPos: divisionToPosition(d), fromNote: n, toPos: divisionToPosition(d + dDiv), toNote: n + dNote });
                    moveNote(id, divisionToPosition(d), n, divisionToPosition(d + dDiv), n + dNote);
                });
                history.push({ type: 'move', moves });
                selectedNotes = new Set([...selectedNotes].map(key => {
                    const [d, n] = key.split(':').map(Number);
                    return cellKey(d + dDiv, n + dNote);
                }));
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
                    history.push({ type: 'remove', entries });
                    entries.forEach(({ position, note }) => removeNote(id, position, note));
                    selectedNotes = new Set();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);

        const handleResizeMove = (e: MouseEvent) => {
            if (!resizing) return;
            sequencerHeights.update(heights => ({
                ...heights,
                [id]: Math.max(120, resizeStartHeight + (e.clientY - resizeStartY))
            }));
        };
        const handleResizeEnd = () => { resizing = false; };
        window.addEventListener("mousemove", handleResizeMove);
        window.addEventListener("mouseup", handleResizeEnd);

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
            window.removeEventListener("mousemove", handleResizeMove);
            window.removeEventListener("mouseup", handleResizeEnd);
            cancelActiveSequencerSubscription();
        };
    });
</script>

<section
    class="sequencer"
    class:sequencer--collapsed={collapsed}
    class:sequencer--resizing={resizing}
    style="border-color: {colour}; height: {collapsed ? '60px' : ($sequencerHeights[id] || 320) + 'px'};"
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
            role="button"
            tabindex="0"
            on:mouseleave={handleMouseLeave}
            on:mouseup={handleGridMouseUp}
            style="min-width: {minWidth};"
            class:sequencer__grid--dragging={mouseIsDown && selectedNotes.size > 0}
        >
            {#each Array($divisions * $bars) as _, divisionIndex}
                {#each Array(notes) as _, noteIndex}
                    <Cell
                        division={divisionIndex}
                        note={noteIndex}
                        row={(notes - noteIndex) + 1}
                        on={$data[id].notes.some(n => happensWithin(divisionIndex, n.position) && n.note === noteIndex)}
                        amp={$data[id].notes.find(n => happensWithin(divisionIndex, n.position) && n.note === noteIndex)?.amp ?? 0.75}
                        focused={currentCell.division === divisionIndex && currentCell.note === noteIndex}
                        selected={selectedNotes.has(cellKey(divisionIndex, noteIndex))}
                        active={$sequencerTs[id] !== -1 && $sequencerTs[id] % ($divisions * $bars) === divisionIndex}
                        handleMouseOver={() => { currentNote = noteIndex; hoverDivision = divisionIndex; }}
                        handleMouseDown={handleMouseDown}
                        handleMouseUp={handleMouseUp}
                        handleMouseFocus={handleMouseFocus}
                        {mouseIsDown}
                        colour={colour}
                        ghost={ghostCells.has(cellKey(divisionIndex, noteIndex))}
                        dragging={mouseIsDown && selectedNotes.size > 0}
                    />
                {/each}
            {/each}
        </div>

    </div>
    {#if currentCell.division !== -1 && currentCell.note !== -1 && $data[id].notes.some(n => n.position === divisionToPosition(currentCell.division) && n.note === currentCell.note)}
        <Meta
            {id}
            amp={$data[id].notes.find(n => n.position === divisionToPosition(currentCell.division) && n.note === currentCell.note)?.amp || 0.75}
            dur={$data[id].notes.find(n => n.position === divisionToPosition(currentCell.division) && n.note === currentCell.note)?.duration || 0.75}
            onChangeAmp={amp => {
                [...(selectedNotes.size > 0 ? selectedNotes : [cellKey(currentCell.division, currentCell.note)])].forEach(key => {
                    const [d, n] = key.split(':').map(Number);
                    updateNoteAmp(id, divisionToPosition(d), n, amp);
                });
            }}
            onChangeDur={duration => {
                [...(selectedNotes.size > 0 ? selectedNotes : [cellKey(currentCell.division, currentCell.note)])].forEach(key => {
                    const [d, n] = key.split(':').map(Number);
                    updateNoteDuration(id, divisionToPosition(d), n, duration);
                });
            }}
        />
    {/if}

    {#if !collapsed}
        <div class="sequencer__resize-handle" role="button" tabindex="0" on:mousedown={handleResizeStart}></div>
    {/if}
</section>

<style lang="scss">
    .sequencer {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        background-color: var(--black-lighter);
        padding: 1rem var(--spacer) 0;
        border-radius: var(--border-radius);
        border: 1.5px solid;
        transition: height 0.2s ease;
        overflow: scroll;
        position: relative;
        flex-shrink: 0;

        &--collapsed {
            overflow: hidden;
        }

        &--resizing {
            transition: none;
            user-select: none;
        }

        &__resize-handle {
            position: sticky;
            bottom: 0;
            margin: 0 calc(-1 * var(--spacer));
            height: 10px;
            cursor: ns-resize;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: var(--black-lighter);
            flex-shrink: 0;

            &::after {
                content: '';
                width: 4rem;
                height: 3px;
                border-radius: 2px;
                background-color: var(--grey-lighter);
                transition: background-color 0.1s ease;
            }

            &:hover::after {
                background-color: white;
            }
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

            &--dragging {
                cursor: move;
            }
        }
    }
</style>