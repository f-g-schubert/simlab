import { supabase } from './supabase.js';

export function initRealtime(onUpdate) {
    const channel = supabase
        .channel('global-updates')
        .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'blog'
        }, onUpdate)
        .on('postgres_changes', {
            event: '*',
            table: 'comments'
        }, onUpdate)
        .on('postgres_changes', {
            event: '*',
            table: 'projects'
        }, onUpdate)
        .on('postgres_changes', {
            event: '*',
            table: 'events'
        }, onUpdate)
        .subscribe();

    return channel;
}