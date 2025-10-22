import React, { useState, useEffect, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'; // Import the plugin for table support
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy, faFilePdf } from '@fortawesome/free-solid-svg-icons';
import jsPDF from 'jspdf';
// --- IMPORT html2canvas ---
import html2canvas from 'html2canvas';
// --- ADD RECHARTS IMPORTS ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Sub-component for Code Blocks (No changes needed here) ---
const CodeBlock = ({ node, inline, className, children, ...props }) => {
  // Shows temporary "Copied!" feedback after successful copy
  const [isCopied, setIsCopied] = useState(false);

  // Text content to copy (strip a trailing newline if present)
  const textToCopy = String(children).replace(/\n$/, '');

  // Track and clear the pending timeout on unmount to avoid memory leaks
  const timeoutRef = useRef(null);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  // Attempt to copy using Clipboard API; fall back to execCommand when unavailable
  const handleCopy = () => {
    const copy = async () => {
      try {
        if (navigator?.clipboard?.writeText) {
          await navigator.clipboard.writeText(textToCopy);
        } else {
          const textarea = document.createElement('textarea');
          textarea.value = textToCopy;
          textarea.setAttribute('readonly', '');
          textarea.style.position = 'absolute';
          textarea.style.left = '-9999px';
          document.body.appendChild(textarea);
          textarea.select();
          document.execCommand('copy');
          document.body.removeChild(textarea);
        }

        setIsCopied(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => setIsCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code: ', err);
      }
    };

    copy();
  };

  // Detect "language-*" class to decide block rendering
  const match = /language-(\w+)/.exec(className || '');

  if (!inline && match) {
    return (
      <div className="code-block-wrapper">
        <pre className={className} {...props}>
          {children}
        </pre>
        <button
          type="button"
          className="code-copy-button"
          onClick={handleCopy}
          title="Copy code"
          aria-live="polite"
        >
          <FontAwesomeIcon icon={faCopy} /> {isCopied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    );
  }

  return (
    <code className={className} {...props}>
      {children}
    </code>
  );
};

// --- Main MessageList Component (Updated) ---
export default function MessageList({ messages, agentConfig, isSending }) {
  const messagesEndRef = useRef(null);
  // --- Ref to store the specific message bubble element ---
  const messageRefs = useRef({}); // Initialize useRef for message elements

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- UPDATED PDF EXPORT LOGIC ---
  const handleExportPDF = useCallback(async (messageId, agentName) => {
    const elementToCapture = messageRefs.current[messageId];
    if (!elementToCapture) {
      console.error("Could not find the message element to capture for PDF export.");
      alert("Could not export message to PDF. Element not found."); // Inform user
      return;
    }

    // --- Optional: Add a loading state ---
    // const exportButton = elementToCapture.querySelector('.export-pdf-button');
    // if (exportButton) exportButton.textContent = 'Exporting...';

    try {
      // Use html2canvas to capture the element
      const canvas = await html2canvas(elementToCapture, {
         scale: 2, // Increase scale for better resolution
         useCORS: true, // Important if images/charts might have external resources
         backgroundColor: null, // Use the element's background, important for themes
         logging: false, // Suppress html2canvas console logs
         // --- Remove problematic elements BEFORE capture ---
         ignoreElements: (element) => element.classList.contains('message-actions') // Ignore the action buttons container
      });

      const imgData = canvas.toDataURL('image/png', 0.95); // Slightly compress PNG

      // Calculate PDF dimensions based on image aspect ratio
      const imgProps = { width: canvas.width, height: canvas.height };
      const pdf = new jsPDF({
        orientation: imgProps.width > imgProps.height ? 'landscape' : 'portrait',
        unit: 'px', // Use pixels for easier mapping
        format: [imgProps.width, imgProps.height], // Set PDF size to image size
        compress: true // Enable PDF compression
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Add the image to the PDF
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST'); // Use FAST compression

      pdf.save(`${agentName}-response-${Date.now()}.pdf`);

    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Sorry, there was an error creating the PDF."); // Inform the user
    } finally {
      // --- Restore button text if you added a loading state ---
      // if (exportButton) exportButton.innerHTML = '<svg ...> Export PDF'; // Restore icon + text
    }
  }, []); // Dependencies remain empty as agentName is passed in

  // --- Function to render different graph types ---
  const renderGraph = (graphData) => {
      // Basic check for valid data structure
     if (!graphData || !graphData.data || !graphData.categoryKey || !graphData.dataKey) {
          return <p style={{color: 'red'}}>Invalid graph data format.</p>;
      }

    // You can expand this switch for different chart types (line, pie, etc.)
    switch (graphData.type) {
      case 'bar':
        return (
          // Important: Provide fixed dimensions or ensure parent has dimensions for ResponsiveContainer
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={graphData.data} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--theme-border-color)" />
                <XAxis dataKey={graphData.categoryKey} stroke="var(--theme-text-secondary)" />
                <YAxis stroke="var(--theme-text-secondary)" />
                <Tooltip
                  contentStyle={{ backgroundColor: 'var(--theme-bg-secondary)', border: '1px solid var(--theme-border-color)' }}
                  itemStyle={{ color: 'var(--theme-text-primary)' }}
                 />
                <Legend />
                <Bar dataKey={graphData.dataKey} fill="var(--theme-accent-color)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      // Add cases for 'line', 'pie', etc. here
      default:
        return <p>Unsupported graph type: {graphData.type}</p>;
    }
  };

  return (
    <div className="gemini-chat-area">
      {messages?.map((msg, index) => {
        const isModelMessage = msg.role === 'model';
        // Ensure a unique and stable ID for referencing
        const messageId = `msg-${msg.timestamp || index}`; // Use timestamp or index

        return (
          <div key={messageId} className={`gemini-message ${msg.role}`}>
            {/* --- Attach ref to the bubble --- */}
            <div
               className="gemini-message-bubble"
               ref={el => messageRefs.current[messageId] = el} // Assign element to ref map
            >
              {/* PDF Export Button Container - This container will be ignored by html2canvas */}
              {isModelMessage && !isSending && (msg.text || msg.graphData || msg.imageUrl) && ( // Show if text, graph, OR image exists
                <div className="message-actions"> {/* This div has the class html2canvas will ignore */}
                  <button
                    className="action-button export-pdf-button"
                    title="Export as PDF"
                    // --- Pass messageId to the handler ---
                    onClick={() => handleExportPDF(messageId, agentConfig?.name || 'AI')}
                  >
                    <FontAwesomeIcon icon={faFilePdf} /> Export PDF
                  </button>
                  {/* Add other action buttons here if needed */}
                </div>
              )}

              {/* --- Conditional Rendering --- */}
              <div className="message-content">
                {/* 1. Render Graph if graphData exists */}
                {msg.graphData ? (
                  <>
                    {/* Render optional text description first */}
                    {msg.text && (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]} // Ensure GFM is included
                        components={{ code: CodeBlock }}
                      >
                        {msg.text}
                      </ReactMarkdown>
                    )}
                    {/* Then render the graph */}
                    <div className="graph-container" style={{ marginTop: msg.text ? '1rem' : '0' }}>
                       {renderGraph(msg.graphData)}
                    </div>
                  </>
                ) : (
                  /* 2. Otherwise, render text/image as before */
                  <>
                    <div className="message-text">
                       {/* Render text using ReactMarkdown (handles tables) */}
                       <ReactMarkdown
                         remarkPlugins={[remarkGfm]} // Ensure GFM is included
                         components={{ code: CodeBlock }}
                       >
                         {msg.text || ''}
                       </ReactMarkdown>
                    </div>
                    {/* Render image if imageUrl exists */}
                    {msg.imageUrl && (
                      // Ensure images load correctly for capture
                      <img src={msg.imageUrl} alt="Generated content" className="generated-image" crossOrigin="anonymous"/>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Loading Indicator */}
      {isSending && messages[messages.length - 1]?.role === 'user' && (
        <div className="gemini-message model">
          <div className="gemini-message-bubble">
            <div className="typing-indicator">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
}