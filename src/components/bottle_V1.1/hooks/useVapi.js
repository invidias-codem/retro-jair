import { useState, useEffect, useCallback } from 'react';
import Vapi from '@vapi-ai/web';

// Initialize Vapi with your Public Key from the dashboard
const vapi = new Vapi(process.env.REACT_APP_VAPI_PUBLIC_KEY);

export const useVapi = () => {
    const [isCallActive, setIsCallActive] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState([]);
    const [callStatus, setCallStatus] = useState('idle'); // idle, connecting, active, ending

    useEffect(() => {
        const onCallStart = () => {
            setCallStatus('active');
            setIsCallActive(true);
            setTranscript([]); // Clear transcript on new call
        };
        const onCallEnd = () => {
            setCallStatus('idle');
            setIsCallActive(false);
            setIsSpeaking(false);
            setIsListening(false);
        };
        const onSpeechStart = () => setIsSpeaking(true);
        const onSpeechEnd = () => setIsSpeaking(false);
        const onUserSpeechStart = () => setIsListening(true);
        const onUserSpeechEnd = () => setIsListening(false);

        const onMessage = (message) => {
            if (message.type === 'transcript' && message.transcriptType === 'final') {
                setTranscript(prev => [...prev, { speaker: message.role, text: message.transcript }]);
            }
        };

        const onError = (e) => {
            console.error('Vapi Error:', e);
            setCallStatus('idle');
            setIsCallActive(false);
        };

        vapi.on('call-start', onCallStart);
        vapi.on('call-end', onCallEnd);
        vapi.on('speech-start', onSpeechStart);
        vapi.on('speech-end', onSpeechEnd);
        vapi.on('user-speech-start', onUserSpeechStart);
        vapi.on('user-speech-end', onUserSpeechEnd);
        vapi.on('message', onMessage);
        vapi.on('error', onError);

        return () => {
            vapi.off('call-start', onCallStart);
            vapi.off('call-end', onCallEnd);
            vapi.off('speech-start', onSpeechStart);
            vapi.off('speech-end', onSpeechEnd);
            vapi.off('user-speech-start', onUserSpeechStart);
            vapi.off('user-speech-end', onUserSpeechEnd);
            vapi.off('message', onMessage);
            vapi.off('error', onError);
        };
    }, []);

    const startCall = useCallback((assistantId) => {
        if (!assistantId) {
            console.error("Vapi Assistant ID is missing.");
            return;
        }
        setCallStatus('connecting');
        vapi.start(assistantId);
    }, []);

    const stopCall = useCallback(() => {
        setCallStatus('ending');
        vapi.stop();
    }, []);

    return {
        isCallActive,
        callStatus,
        isSpeaking,
        isListening,
        transcript,
        startCall,
        stopCall,
    };
};