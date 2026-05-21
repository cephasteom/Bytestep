import { writable } from "svelte/store";
import type { Dictionary } from './types'
export const samples = writable<Dictionary>({});
