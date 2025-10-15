// Global key tracking object
export const keys = {};

// Key listeners
export function setupInput() {
    document.addEventListener("keydown", e => {
        keys[e.key] = true;
    });
    document.addEventListener("keyup", e => {
        keys[e.key] = false;
    });
}
