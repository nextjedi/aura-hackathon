import { useState } from 'react';
import { Sparkles, Download, RefreshCw, ArrowLeft, Users, ShoppingBag } from 'lucide-react';
import ShoppingSuggestions from './ShoppingSuggestions';

const StyleBoard = ({ generatedImage, selectedClothing, conversationContext, onReset, onCoupleVisualization }) => {
  const [isRefining, setIsRefining] = useState(false);
  const [showShopping, setShowShopping] = useState(false);

  const handleDownload = () => {
    // TODO: Implement actual download functionality
    alert('Download functionality will be implemented in Phase 4!');
  };

  const handleRefine = () => {
    setIsRefining(true);
    // TODO: Implement iterative editing in Phase 3
    setTimeout(() => {
      setIsRefining(false);
      alert('Refinement features coming in Phase 3!');
    }, 1500);
  };

  return (
    <div className="glass-morphism p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-semibold">Your Style Board</h2>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Start Over</span>
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Generated Style Image */}
        <div className="space-y-4">
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Generated Style</h3>
            <div className="bg-gray-800 rounded-lg h-64 flex items-center justify-center">
              {generatedImage?.imageUrl ? (
                <img
                  src={generatedImage.imageUrl}
                  alt="Generated style"
                  className="max-w-full max-h-full rounded-lg"
                />
              ) : (
                <div className="text-center">
                  <Sparkles className="w-12 h-12 text-purple-400 mx-auto mb-2 animate-pulse-slow" />
                  <p className="text-gray-400">Your perfect style visualization</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Image generation will be implemented with Gemini Vision API
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
              <button
                onClick={handleRefine}
                disabled={isRefining}
                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${isRefining ? 'animate-spin' : ''}`} />
                <span>{isRefining ? 'Refining...' : 'Refine Style'}</span>
              </button>
            </div>
            
            {/* Couple Visualization Button */}
            <button
              onClick={() => onCoupleVisualization && onCoupleVisualization()}
              className="w-full bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
            >
              <Users className="w-4 h-4" />
              <span>Create Couple Visualization</span>
            </button>

            {/* Shopping Button */}
            <button
              onClick={() => setShowShopping(!showShopping)}
              className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all duration-300"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{showShopping ? 'Hide Shopping' : 'Shop This Look'}</span>
            </button>
          </div>
        </div>

        {/* Style Analysis & Suggestions */}
        <div className="space-y-4">
          {/* Original Clothing Summary */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Original Piece</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Type:</span>
                <span className="bg-purple-600/20 text-purple-300 px-2 py-1 rounded text-sm">
                  {selectedClothing?.type || 'Clothing Item'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Color:</span>
                <span className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-sm">
                  {selectedClothing?.color || 'Color'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400">Style:</span>
                <span className="bg-green-600/20 text-green-300 px-2 py-1 rounded text-sm">
                  {selectedClothing?.style || 'Style'}
                </span>
              </div>
            </div>
          </div>

          {/* Stylist's Notes */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Stylist's Notes</h3>
            <div className="space-y-2 text-sm">
              {generatedImage?.notes ? (
                generatedImage.notes.map((note, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span className="text-gray-300">{note}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span className="text-gray-300">Perfect color coordination for your complexion</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span className="text-gray-300">Excellent choice for the occasion</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-purple-400 mt-1">•</span>
                    <span className="text-gray-300">Consider adding complementary accessories</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Accessories & Recommendations */}
          <div className="bg-gray-900/50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-3">Recommended Accessories</h3>
            <div className="grid grid-cols-2 gap-2">
              {generatedImage?.accessories ? (
                generatedImage.accessories.map((accessory, index) => (
                  <div key={index} className="bg-gray-800 p-2 rounded text-sm text-center">
                    {accessory}
                  </div>
                ))
              ) : (
                <>
                  <div className="bg-gray-800 p-2 rounded text-sm text-center">Silver Watch</div>
                  <div className="bg-gray-800 p-2 rounded text-sm text-center">Leather Belt</div>
                  <div className="bg-gray-800 p-2 rounded text-sm text-center">Oxford Shoes</div>
                  <div className="bg-gray-800 p-2 rounded text-sm text-center">Pocket Square</div>
                </>
              )}
            </div>
          </div>

          {/* AI Confidence */}
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="font-semibold">AI Confidence</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-gray-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(selectedClothing?.confidence || 0.9) * 100}%` }}
                />
              </div>
              <span className="text-sm font-semibold">
                {Math.round((selectedClothing?.confidence || 0.9) * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              This style combination has high confidence based on color theory, occasion appropriateness, and current trends.
            </p>
          </div>
        </div>
      </div>

      {/* Phase 3 Features Preview */}
      <div className="mt-6 p-4 bg-yellow-600/20 rounded-lg">
        <h4 className="font-semibold text-yellow-300 mb-2">Coming in Phase 3:</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-yellow-200">
          <div>• Voice commands for refinements</div>
          <div>• Real-time emotion feedback</div>
          <div>• Iterative style editing</div>
        </div>
      </div>
      
      {/* Shopping Suggestions */}
      {showShopping && (
        <div className="mt-8">
          <ShoppingSuggestions
            recommendations={{
              suit: {
                style: selectedClothing?.type || 'suit',
                color: selectedClothing?.color || 'navy',
                fit: 'regular'
              },
              shirt: {
                color: 'white',
                style: 'dress shirt'
              },
              accessories: {
                tie: 'silk tie',
                watch: 'dress watch',
                shoes: 'oxford shoes'
              }
            }}
            context={conversationContext}
            onPurchaseClick={(item) => {
              console.log('Purchase clicked:', item.name);
              // Analytics tracking could go here
            }}
          />
        </div>
      )}
    </div>
  );
};

export default StyleBoard;