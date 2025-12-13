
import Vapi from '@vapi-ai/web';

// Initialize Vapi with your Public Key
const vapi = new Vapi(process.env.REACT_APP_VAPI_PUBLIC_KEY);

// --- Vapi Event Listeners ---
const setupVapiListeners = () => {
    vapi.on('call-start', () => {
        console.log('Vapi call has started.');
        // You can add state updates here, e.g., setIsCallActive(true)
    });

    vapi.on('call-end', () => {
        console.log('Vapi call has ended.');
        // You can add state updates here, e.g., setIsCallActive(false)
    });

    vapi.on('speech-start', () => {
        console.log('Vapi speech has started.');
    });

    vapi.on('speech-end', () => {
        console.log('Vapi speech has ended.');
    });

    vapi.on('message', (message) => {
        console.log('Vapi message:', message);
        // Handle incoming messages from Vapi during the call
    });

    vapi.on('error', (error) => {
        console.error('Vapi error:', error);
        // Handle errors
    });
};

// Call this function once when your component mounts
setupVapiListeners();


// --- Vapi Control Functions ---

/**
 * Starts a Vapi call with the specified assistant ID.
 * @param {string} assistantId - The ID of the Vapi assistant to call.
 */
export const startVapiCall = (assistantId) => {
    if (!assistantId) {
        console.error("startVapiCall: assistantId is required.");
        return;
    }
    console.log(`Starting Vapi call with assistant: ${assistantId}`);
    vapi.start(assistantId);
};

/**
 * Ends the current Vapi call.
 */
export const endVapiCall = () => {
    console.log("Ending Vapi call.");
    vapi.stop();
};

/**
 * Toggles the mute state of the microphone.
 * @returns {boolean} The new mute state.
 */
export const toggleMute = () => {
    const isMuted = vapi.isMuted();
    vapi.setMuted(!isMuted);
    console.log(`Vapi mute toggled to: ${!isMuted}`);
    return !isMuted;
};

// Export the vapi instance itself if direct access is needed
export default vapi;
