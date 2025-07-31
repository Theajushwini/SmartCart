import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";

const StoreMap = () => {
  const { userId } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [highlightedArea, setHighlightedArea] = useState(null);

  // Sample store layout with product locations
  const storeAreas = {
    "fruits": { x: 100, y: 150, width: 120, height: 80, color: "#28a745" },
    "vegetables": { x: 250, y: 150, width: 120, height: 80, color: "#20c997" },
    "dairy": { x: 100, y: 250, width: 120, height: 80, color: "#17a2b8" },
    "meat": { x: 250, y: 250, width: 120, height: 80, color: "#dc3545" },
    "bakery": { x: 100, y: 350, width: 120, height: 80, color: "#fd7e14" },
    "beverages": { x: 250, y: 350, width: 120, height: 80, color: "#6f42c1" },
    "snacks": { x: 400, y: 150, width: 120, height: 80, color: "#ffc107" },
    "frozen": { x: 400, y: 250, width: 120, height: 80, color: "#6c757d" },
    "checkout": { x: 175, y: 50, width: 150, height: 60, color: "#495057" }
  };

  // Sample products with their locations
  const products = {
    "apple": { area: "fruits", name: "Apple" },
    "banana": { area: "fruits", name: "Banana" },
    "orange": { area: "fruits", name: "Orange" },
    "carrot": { area: "vegetables", name: "Carrot" },
    "broccoli": { area: "vegetables", name: "Broccoli" },
    "tomato": { area: "vegetables", name: "Tomato" },
    "milk": { area: "dairy", name: "Milk" },
    "cheese": { area: "dairy", name: "Cheese" },
    "yogurt": { area: "dairy", name: "Yogurt" },
    "chicken": { area: "meat", name: "Chicken" },
    "beef": { area: "meat", name: "Beef" },
    "bread": { area: "bakery", name: "Bread" },
    "cake": { area: "bakery", name: "Cake" },
    "cola": { area: "beverages", name: "Cola" },
    "water": { area: "beverages", name: "Water" },
    "chips": { area: "snacks", name: "Chips" },
    "cookies": { area: "snacks", name: "Cookies" },
    "ice cream": { area: "frozen", name: "Ice Cream" }
  };

  const handleSearch = (term) => {
    const product = Object.keys(products).find(key => 
      products[key].name.toLowerCase().includes(term.toLowerCase())
    );
    
    if (product) {
      const area = products[product].area;
      setSelectedProduct(products[product]);
      setHighlightedArea(area);
      
      // Auto-clear highlight after 3 seconds
      setTimeout(() => {
        setHighlightedArea(null);
        setSelectedProduct(null);
      }, 3000);
    } else {
      setHighlightedArea(null);
      setSelectedProduct(null);
    }
  };

  const handleAreaClick = (areaName) => {
    setHighlightedArea(areaName);
    setSelectedProduct({ area: areaName, name: areaName.charAt(0).toUpperCase() + areaName.slice(1) });
    
    setTimeout(() => {
      setHighlightedArea(null);
      setSelectedProduct(null);
    }, 2000);
  };

  return (
    <div className="store-map-container">
      <div className="map-header">
        <h2>🗺️ Smart Store Map</h2>
        <div className="search-container">
          <div className="search-input-wrapper">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search for products..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                if (e.target.value.length > 2) {
                  handleSearch(e.target.value);
                }
              }}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {selectedProduct && (
        <div className="product-found-banner">
          <FaMapMarkerAlt />
          <span>{selectedProduct.name} found in {selectedProduct.area.toUpperCase()} section!</span>
        </div>
      )}

      <div className="map-container">
        <svg
          width="600"
          height="500"
          viewBox="0 0 600 500"
          className="store-svg"
        >
          {/* Store Background */}
          <rect
            x="50"
            y="30"
            width="500"
            height="440"
            fill="#f8f9fa"
            stroke="#dee2e6"
            strokeWidth="2"
            rx="10"
          />
          
          {/* Store Title */}
          <text x="300" y="20" textAnchor="middle" className="store-title">
            SmartCart Store Layout
          </text>

          {/* Store Areas */}
          {Object.entries(storeAreas).map(([areaName, area]) => (
            <g key={areaName}>
              <rect
                x={area.x}
                y={area.y}
                width={area.width}
                height={area.height}
                fill={highlightedArea === areaName ? area.color : `${area.color}40`}
                stroke={area.color}
                strokeWidth={highlightedArea === areaName ? "4" : "2"}
                rx="8"
                className={`store-area ${highlightedArea === areaName ? 'highlighted' : ''}`}
                onClick={() => handleAreaClick(areaName)}
                style={{ cursor: 'pointer' }}
              />
              
              {/* Area Labels */}
              <text
                x={area.x + area.width / 2}
                y={area.y + area.height / 2}
                textAnchor="middle"
                className="area-label"
                fill="white"
                fontWeight="bold"
                fontSize="12"
              >
                {areaName.toUpperCase()}
              </text>
              
              {/* Animated pulse for highlighted area */}
              {highlightedArea === areaName && (
                <circle
                  cx={area.x + area.width / 2}
                  cy={area.y + area.height / 2}
                  r="5"
                  fill={area.color}
                  className="pulse-marker"
                />
              )}
            </g>
          ))}

          {/* Navigation Paths */}
          <path
            d="M 75 130 L 525 130"
            stroke="#dee2e6"
            strokeWidth="20"
            strokeDasharray="5,5"
            opacity="0.5"
          />
          <path
            d="M 75 450 L 525 450"
            stroke="#dee2e6"
            strokeWidth="20"
            strokeDasharray="5,5"
            opacity="0.5"
          />
          <path
            d="M 75 130 L 75 450"
            stroke="#dee2e6"
            strokeWidth="15"
            strokeDasharray="5,5"
            opacity="0.5"
          />
          <path
            d="M 525 130 L 525 450"
            stroke="#dee2e6"
            strokeWidth="15"
            strokeDasharray="5,5"
            opacity="0.5"
          />

          {/* Entrance */}
          <rect
            x="275"
            y="470"
            width="50"
            height="20"
            fill="#28a745"
            rx="5"
          />
          <text x="300" y="485" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
            ENTRANCE
          </text>

          {/* You Are Here Marker */}
          <g className="you-are-here">
            <circle cx="300" cy="480" r="8" fill="#dc3545" className="pulse-dot" />
            <text x="300" y="500" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#dc3545">
              YOU ARE HERE
            </text>
          </g>
        </svg>
      </div>

      <div className="map-legend">
        <h4>🏪 Store Sections</h4>
        <div className="legend-grid">
          {Object.entries(storeAreas).map(([areaName, area]) => (
            <div 
              key={areaName} 
              className="legend-item"
              onClick={() => handleAreaClick(areaName)}
            >
              <div 
                className="legend-color" 
                style={{ backgroundColor: area.color }}
              ></div>
              <span>{areaName.charAt(0).toUpperCase() + areaName.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="map-info">
        <p><strong>Session ID:</strong> {userId}</p>
        <p>💡 <strong>Tip:</strong> Search for products or click on store sections to navigate!</p>
      </div>
    </div>
  );
};

export default StoreMap;

