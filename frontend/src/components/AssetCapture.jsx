import React, { useState, useRef, useCallback } from 'react';

const AssetCapture = ({ onAssetCaptured, context }) => {
  const [activeCapture, setActiveCapture] = useState(null); // 'closet', 'body', 'venue'
  const [capturedAssets, setCapturedAssets] = useState({
    closetImage: null,
    bodyImage: null,
    venueImage: null
  });
  const fileInputRef = useRef(null);

  const captureTypes = {
    closet: {
      title: "📱 Snap Your Closet",
      description: "Let me see what gorgeous pieces you're working with!",
      emoji: "👗",
      prompt: "Show me your wardrobe options - suits, shirts, ties, shoes!"
    },
    body: {
      title: "📸 Perfect Fit Analysis",
      description: "This helps me recommend the perfect fit for your body type",
      emoji: "👤",
      prompt: "A full-body photo helps me suggest the most flattering styles!"
    },
    venue: {
      title: "🏢 Venue Vibe Check",
      description: "Show me where you're going so I can match the perfect style",
      emoji: "📍",
      prompt: context.location ? `Show me ${context.location} or a similar venue!` : "Share a photo of your destination!"
    }
  };

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file && activeCapture) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target.result;
        const updatedAssets = {
          ...capturedAssets,
          [`${activeCapture}Image`]: imageData
        };
        setCapturedAssets(updatedAssets);
        onAssetCaptured(activeCapture, imageData);
        setActiveCapture(null);
        
        // Reset file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    }
  }, [activeCapture, capturedAssets, onAssetCaptured]);

  const triggerCapture = (type) => {
    setActiveCapture(type);
    fileInputRef.current?.click();
  };

  const removeAsset = (type) => {
    const updatedAssets = {
      ...capturedAssets,
      [`${type}Image`]: null
    };
    setCapturedAssets(updatedAssets);
    onAssetCaptured(type, null);
  };

  return (
    <div className="asset-capture-container p-4 glass-morphism rounded-lg space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">
        📋 Style Assets - Let's Gather Everything!
      </h3>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.entries(captureTypes).map(([type, config]) => (
          <div key={type} className="capture-card">
            {capturedAssets[`${type}Image`] ? (
              // Asset captured - show preview
              <div className="relative group">
                <img
                  src={capturedAssets[`${type}Image`]}
                  alt={`${type} asset`}
                  className="w-full h-32 object-cover rounded-lg border-2 border-green-400"
                />
                <div className="absolute top-2 right-2">
                  <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs">
                    ✓ Captured
                  </span>
                </div>
                <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                  <button
                    onClick={() => removeAsset(type)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              // No asset - show capture button
              <button
                onClick={() => triggerCapture(type)}
                className="capture-button w-full h-32 border-2 border-dashed border-purple-400 rounded-lg hover:border-pink-400 transition-colors flex flex-col items-center justify-center space-y-2 hover:bg-purple-500 hover:bg-opacity-10"
              >
                <span className="text-3xl">{config.emoji}</span>
                <span className="text-sm font-medium text-white">{config.title}</span>
                <span className="text-xs text-gray-300 px-2 text-center">
                  {config.prompt}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="progress-section mt-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">Style Assets Progress</span>
          <span className="text-sm text-gray-300">
            {Object.values(capturedAssets).filter(Boolean).length}/3
          </span>
        </div>
        <div className="progress-bar bg-gray-700 rounded-full h-2">
          <div
            className="progress-fill bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
            style={{
              width: `${(Object.values(capturedAssets).filter(Boolean).length / 3) * 100}%`
            }}
          />
        </div>
      </div>

      {/* Helpful tips */}
      <div className="tips-section mt-4 p-3 bg-purple-500 bg-opacity-20 rounded-lg">
        <h4 className="text-sm font-medium text-white mb-2">💡 Pro Tips:</h4>
        <ul className="text-xs text-gray-300 space-y-1">
          <li>• Good lighting makes all the difference!</li>
          <li>• For closet shots: spread items out for better visibility</li>
          <li>• For body photos: stand straight, full length works best</li>
          <li>• Venue photos help me match the perfect vibe</li>
        </ul>
      </div>
    </div>
  );
};

export default AssetCapture;