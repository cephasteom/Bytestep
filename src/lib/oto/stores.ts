import { writable } from "svelte/store";
export const samples = writable<Record<string, any>>({});
