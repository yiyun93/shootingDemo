// Global key tracking object
export const keys = {};

// Key listeners
export function setupInput() {
    document.addEventListener("keydown", e => {
        keys[e.code] = true;
    });
    document.addEventListener("keyup", e => {
        keys[e.code] = false;
    });
}
