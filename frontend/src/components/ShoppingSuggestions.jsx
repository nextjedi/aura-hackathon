import React, { useState } from 'react';
import { ShoppingBag, ExternalLink, Star, DollarSign, Truck } from 'lucide-react';

const ShoppingSuggestions = ({ 
  recommendations, 
  context, 
  userPreferences = {},
  onPurchaseClick 
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Amazon affiliate tag - replace with actual affiliate ID
  const AMAZON_AFFILIATE_TAG = 'aura-style-20';
  
  // Shopping suggestions based on outfit recommendations
  const generateShoppingSuggestions = () => {
    const baseSuggestions = {
      suits: [
        {
          id: 'suit-navy-1',
          name: 'Navy Single-Breasted Wool Suit',
          brand: 'Hugo Boss',
          price: '$599.99',
          originalPrice: '$799.99',
          rating: 4.8,
          reviews: 2847,
          category: 'suits',
          description: 'Premium wool construction with modern slim fit',
          features: ['100% Wool', 'Dry Clean Only', 'Tailored Fit'],
          amazonUrl: `https://amazon.com/dp/B08XXXXX?tag=${AMAZON_AFFILIATE_TAG}`,
          imageUrl: '/demo-assets/navy-suit.jpg',
          inStock: true,
          fastShipping: true
        },
        {
          id: 'suit-charcoal-1',
          name: 'Charcoal Gray Business Suit',
          brand: 'Calvin Klein',
          price: '$449.99',
          originalPrice: '$599.99',
          rating: 4.6,
          reviews: 1923,
          category: 'suits',
          description: 'Classic charcoal suit perfect for business occasions',
          features: ['Wrinkle Resistant', 'Modern Fit', 'All Season'],
          amazonUrl: `https://amazon.com/dp/B08YYYYY?tag=${AMAZON_AFFILIATE_TAG}`,
          imageUrl: '/demo-assets/charcoal-suit.jpg',
          inStock: true,
          fastShipping: true
        }
      ],
      shirts: [
        {
          id: 'shirt-white-1',
          name: 'Premium White Dress Shirt',
          brand: 'Brooks Brothers',
          price: '$89.99',
          originalPrice: '$125.00',
          rating: 4.9,
          reviews: 5632,
          category: 'shirts',
          description: 'Non-iron white dress shirt with spread collar',
          features: ['Non-Iron', 'Cotton', 'Spread Collar', 'French Cuffs'],
          amazonUrl: `https://amazon.com/dp/B08ZZZZ1?tag=${AMAZON_AFFILIATE_TAG}`,
          imageUrl: '/demo-assets/white-shirt.jpg',
          inStock: true,
          fastShipping: true
        },
        {
          id: 'shirt-blue-1',
          name: 'Light Blue Dress Shirt',
          brand: 'Charles Tyrwhitt',
          price: '$69.99',
          originalPrice: '$95.00',
          rating: 4.7,
          reviews: 3421,
          category: 'shirts',
          description: 'Classic light blue with subtle texture',
          features: ['Easy Care', 'Slim Fit', 'Button Cuffs'],
          amazonUrl: `https://amazon.com/dp/B08ZZZZ2?tag=${AMAZON_AFFILIATE_TAG}`,
          imageUrl: '/demo-assets/blue-shirt.jpg',
          inStock: true,
          fastShipping: false
        }
      ],
      accessories: [
        {
          id: 'tie-burgundy-1',
          name: 'Burgundy Silk Tie with Diagonal Stripes',
          brand: 'Hermès',
          price: '$195.00',
          originalPrice: '$195.00',
          rating: 4.9,
          reviews: 847,
          category: 'accessories',
          description: 'Luxury silk tie with classic pattern',
          features: ['100% Silk', 'Hand Rolled', 'Made in France'],
          amazonUrl: `https://amazon.com/dp/B08AAAA1?tag=${AMAZON_AFFILIATE_TAG}`,
          imageUrl: '/demo-assets/burgundy-tie.jpg',
          inStock: true,
          fastShipping: true
        },
        {
          id: 'watch-silver-1',
          name: 'Silver Dress Watch',
          brand: 'Citizen',
          price: '$299.99',
          originalPrice: '$399.99',
          rating: 4.8,
          reviews: 2156,
          category: 'accessories',
          description: 'Elegant silver watch with leather strap',
          features: ['Eco-Drive', 'Water Resistant', 'Leather Band'],
          amazonUrl: `https://amazon.com/dp/B08AAAA2?tag=${AMAZON_AFFILIATE_TAG}`,
          imageUrl: '/demo-assets/silver-watch.jpg',
          inStock: true,
          fastShipping: true
        },
        {
          id: 'shoes-oxford-1',
          name: 'Black Oxford Dress Shoes',
          brand: 'Cole Haan',
          price: '$249.99',
          originalPrice: '$320.00',
          rating: 4.6,
          reviews: 1834,
          category: 'accessories',
          description: 'Classic black Oxford shoes with modern comfort',
          features: ['Leather Upper', 'Cushioned Sole', 'Goodyear Welt'],
          amazonUrl: `https://amazon.com/dp/B08AAAA3?tag=${AMAZON_AFFILIATE_TAG}`,
          imageUrl: '/demo-assets/black-oxfords.jpg',
          inStock: false,
          fastShipping: false
        }
      ]
    };

    // Filter based on recommendations
    let filtered = [];
    
    if (recommendations?.suit) {
      const suitColor = recommendations.suit.color?.toLowerCase();
      filtered.push(...baseSuggestions.suits.filter(suit => 
        suit.name.toLowerCase().includes(suitColor) || suitColor.includes('navy') || suitColor.includes('charcoal')
      ));
    } else {
      filtered.push(...baseSuggestions.suits);
    }

    filtered.push(...baseSuggestions.shirts);
    filtered.push(...baseSuggestions.accessories);

    return filtered;
  };

  const allSuggestions = generateShoppingSuggestions();
  
  const filteredSuggestions = selectedCategory === 'all' 
    ? allSuggestions 
    : allSuggestions.filter(item => item.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All Items', count: allSuggestions.length },
    { id: 'suits', name: 'Suits', count: allSuggestions.filter(i => i.category === 'suits').length },
    { id: 'shirts', name: 'Shirts', count: allSuggestions.filter(i => i.category === 'shirts').length },
    { id: 'accessories', name: 'Accessories', count: allSuggestions.filter(i => i.category === 'accessories').length }
  ];

  const handlePurchaseClick = (item) => {
    // Track the click for analytics
    console.log('🛒 Shopping click:', item.name);
    
    // Open Amazon link in new tab
    window.open(item.amazonUrl, '_blank', 'noopener,noreferrer');
    
    // Call callback if provided
    if (onPurchaseClick) {
      onPurchaseClick(item);
    }
  };

  const calculateSavings = (price, originalPrice) => {
    if (!originalPrice || originalPrice === price) return null;
    const savings = parseFloat(originalPrice.replace('$', '')) - parseFloat(price.replace('$', ''));
    const percentage = Math.round((savings / parseFloat(originalPrice.replace('$', ''))) * 100);
    return { amount: `$${savings.toFixed(2)}`, percentage };
  };

  return (
    <div className="shopping-suggestions p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <ShoppingBag className="w-8 h-8 text-green-400" />
              Shopping Suggestions
            </h2>
            <p className="text-gray-400 mt-1">Curated items to complete your perfect look</p>
          </div>
          <div className="text-right text-sm text-gray-400">
            <p>Powered by Amazon</p>
            <p>Affiliate partnership</p>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex gap-2 flex-wrap">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span>{category.name}</span>
                <span className="bg-gray-600 text-xs px-2 py-1 rounded-full">
                  {category.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Shopping Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSuggestions.map(item => {
            const savings = calculateSavings(item.price, item.originalPrice);
            
            return (
              <div key={item.id} className="bg-gray-800/50 rounded-lg overflow-hidden hover:bg-gray-800/70 transition-all duration-300 group">
                
                {/* Product Image */}
                <div className="relative h-48 bg-gray-700 flex items-center justify-center">
                  {item.imageUrl ? (
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className="w-full h-full flex items-center justify-center text-6xl">
                    {item.category === 'suits' ? '👔' : 
                     item.category === 'shirts' ? '👔' :
                     item.category === 'accessories' && item.name.includes('tie') ? '👔' :
                     item.category === 'accessories' && item.name.includes('watch') ? '⌚' :
                     item.category === 'accessories' && item.name.includes('shoe') ? '👞' : '🛍️'}
                  </div>
                  
                  {/* Stock Status */}
                  <div className="absolute top-3 left-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      item.inStock 
                        ? 'bg-green-600/90 text-white' 
                        : 'bg-red-600/90 text-white'
                    }`}>
                      {item.inStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                  
                  {/* Fast Shipping Badge */}
                  {item.fastShipping && (
                    <div className="absolute top-3 right-3">
                      <div className="bg-blue-600/90 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Truck className="w-3 h-3" />
                        Fast Ship
                      </div>
                    </div>
                  )}

                  {/* Savings Badge */}
                  {savings && (
                    <div className="absolute bottom-3 right-3">
                      <div className="bg-red-600/90 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Save {savings.percentage}%
                      </div>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-2">
                    <h3 className="font-semibold text-white text-lg leading-tight mb-1">
                      {item.name}
                    </h3>
                    <p className="text-gray-400 text-sm">{item.brand}</p>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Features */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {item.features.slice(0, 3).map((feature, index) => (
                      <span 
                        key={index}
                        className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>

                  {/* Rating */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${
                            i < Math.floor(item.rating) 
                              ? 'text-yellow-400 fill-current' 
                              : 'text-gray-500'
                          }`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-300">
                      {item.rating} ({item.reviews.toLocaleString()} reviews)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <span className="text-2xl font-bold text-green-400">
                        {item.price}
                      </span>
                      {savings && (
                        <span className="text-gray-400 text-sm ml-2 line-through">
                          {item.originalPrice}
                        </span>
                      )}
                    </div>
                    {savings && (
                      <div className="text-right">
                        <div className="text-green-400 text-sm font-medium">
                          Save {savings.amount}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Purchase Button */}
                  <button
                    onClick={() => handlePurchaseClick(item)}
                    disabled={!item.inStock}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                      item.inStock
                        ? 'bg-orange-600 hover:bg-orange-700 text-white hover:scale-[1.02] shadow-lg hover:shadow-orange-500/25'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ExternalLink className="w-4 h-4" />
                    {item.inStock ? 'Buy on Amazon' : 'Currently Unavailable'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-800/30 rounded-lg">
          <p className="text-gray-400 text-sm text-center">
            <strong>Affiliate Disclosure:</strong> AURA earns a commission from qualifying Amazon purchases. 
            This helps support our AI styling service at no extra cost to you. 
            Prices and availability are subject to change.
          </p>
        </div>

        {/* Value Proposition */}
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🎯</div>
            <h4 className="font-semibold text-white mb-1">AI-Curated</h4>
            <p className="text-gray-400 text-sm">Personally selected based on your style profile</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">💰</div>
            <h4 className="font-semibold text-white mb-1">Best Deals</h4>
            <p className="text-gray-400 text-sm">Competitive prices with exclusive discounts</p>
          </div>
          <div className="text-center p-4">
            <div className="text-3xl mb-2">🚚</div>
            <h4 className="font-semibold text-white mb-1">Fast Delivery</h4>
            <p className="text-gray-400 text-sm">Amazon Prime eligible items for quick shipping</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ShoppingSuggestions;