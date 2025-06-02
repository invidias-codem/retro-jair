const reportWebVitals = onPerfEntry => {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      // Define a handler function that will process the metric
      // before calling the original onPerfEntry callback.
      const handlePerfEntry = (metric) => {
        // Example: Use spread syntax to create a new object with all properties
        // from the original metric, and add a custom property (e.g., a timestamp).
        const augmentedMetric = {
          ...metric, // Copies all properties from the original metric
          reportedAt: Date.now(), // Adds a new custom property
          // You could also override existing metric properties here if needed,
          // by placing them after the ...metric spread.
          // For example: name: `${metric.name}-custom`
        };
        onPerfEntry(augmentedMetric); // Call the original callback with the augmented metric
      };

      // Pass the new handler to the web-vitals functions
      getCLS(handlePerfEntry);
      getFID(handlePerfEntry);
      getFCP(handlePerfEntry);
      getLCP(handlePerfEntry);
      getTTFB(handlePerfEntry);
    }).catch(err => {
      // Optional: Add error handling for the dynamic import itself
      console.error('Failed to load web-vitals', err);
    });
  }
};

export default reportWebVitals;
