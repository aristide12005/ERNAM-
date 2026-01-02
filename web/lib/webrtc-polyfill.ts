'use client';

if (typeof window !== 'undefined') {
    // Polyfill global
    if (typeof (window as any).global === 'undefined') {
        (window as any).global = window;
    }

    // Polyfill process
    if (typeof (window as any).process === 'undefined') {
        (window as any).process = {
            env: { DEBUG: undefined },
        };
    }

    // Polyfill Buffer (optional, but good for some webrtc libs)
    // if (typeof (window as any).Buffer === 'undefined') {
    //     (window as any).Buffer = require('buffer').Buffer;
    // }
}

export { };
