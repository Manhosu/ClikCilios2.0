export function generateId() {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
export function generateIdWithPrefix(prefix) {
    return `${prefix}_${generateId()}`;
}
