import { addNote, removeNote, moveNote, updateNoteAmp, updateNoteDuration } from "$lib/stores/sequencers";

export type HistoryEntry =
    | { type: 'add'; position: number; note: number }
    | { type: 'remove'; entries: { position: number; note: number; amp: number; duration: number }[] }
    | { type: 'move'; moves: { fromPos: number; fromNote: number; toPos: number; toNote: number }[] };

export function createHistory(id: number) {
    let entries: HistoryEntry[] = [];

    function push(entry: HistoryEntry) {
        entries = [...entries, entry];
    }

    function undo(): boolean {
        const entry = entries[entries.length - 1];
        if (!entry) return false;
        entries = entries.slice(0, -1);

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

        return true;
    }

    return { push, undo };
}
