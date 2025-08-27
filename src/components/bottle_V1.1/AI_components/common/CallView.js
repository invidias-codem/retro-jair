import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhoneSlash, faSpinner, faMicrophone, faMicrophoneSlash } from '@fortawesome/free-solid-svg-icons';
import './callView.css';

const CallView = ({ agent, callStatus, transcript, isSpeaking, isListening, stopCall }) => {
    const transcriptEndRef = useRef(null);

    // Automatically scroll to the latest message in the transcript.
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcript]);

    // Memoize the status text calculation to prevent re-running it on every render.
    const statusText = useMemo(() => {
        switch (callStatus) {
            case 'connecting':
                return 'Connecting...';
            case 'active':
                if (isSpeaking) return `${agent.name} is speaking...`;
                if (isListening) return `Listening...`;
                return 'Connected';
            case 'ending':
                return 'Ending call...';
            default:
                return 'Ready to call';
        }
    }, [callStatus, isSpeaking, isListening, agent.name]);

    // Memoize the icon for the end call button.
    const endCallIcon = useMemo(() => (
        callStatus === 'ending' ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPhoneSlash} />
    ), [callStatus]);

    // Use a stable, memoized callback for the stop call action.
    const handleStopCall = useCallback(() => {
        if (callStatus === 'active') {
            stopCall();
        }
    }, [callStatus, stopCall]);

    return (
        <div className="call-view-container">
            <div className="call-view-header">
                <div className="agent-avatar-icon">
                    <FontAwesomeIcon icon={agent.icon} size="2x" />
                </div>
                <h2 className="agent-name">{agent.name}</h2>
                <p className="call-status">{statusText}</p>
            </div>

            <div className="transcript-container">
                {transcript.map((entry, index) => (
                    <div key={`transcript-${index}`} className={`transcript-entry ${entry.speaker}`}>
                        <span className="speaker-label">{entry.speaker === 'assistant' ? agent.name : 'You'}:</span>
                        <p className="transcript-text">{entry.text}</p>
                    </div>
                ))}
                <div ref={transcriptEndRef} />
            </div>

            <div className="call-view-footer">
                <div className={`mic-status-icon ${isListening ? 'listening' : ''}`}>
                    <FontAwesomeIcon icon={isListening ? faMicrophone : faMicrophoneSlash} />
                </div>
                <button onClick={handleStopCall} className="end-call-button" disabled={callStatus !== 'active'}>
                    {endCallIcon}
                    <span>End Call</span>
                </button>
            </div>
        </div>
    );
};

export default React.memo(CallView);