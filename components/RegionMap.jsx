'use client';

import regionsData from '../data/regions.json';

// Simplified US map regions with approximate coordinates
// Each region is represented by a clickable area positioned roughly where states are
const regionCoordinates = {
  pacific_northwest: { 
    x: 50, y: 50, width: 140, height: 180, 
    color: '#DDA15E',
    path: 'M 50 50 L 190 50 L 190 230 L 50 230 Z'
  },
  northern_pacific_coastal: { 
    x: 50, y: 180, width: 100, height: 120, 
    color: '#FFB6C1',
    path: 'M 50 180 L 150 180 L 150 300 L 50 300 Z'
  },
  desert_southwest: { 
    x: 180, y: 250, width: 200, height: 140, 
    color: '#FF6B6B',
    path: 'M 180 250 L 380 250 L 380 390 L 180 390 Z'
  },
  mountain_west: { 
    x: 200, y: 120, width: 180, height: 180, 
    color: '#A8E6CF',
    path: 'M 200 120 L 380 120 L 380 300 L 200 300 Z'
  },
  southern_plains_sunbelt: { 
    x: 380, y: 220, width: 220, height: 120, 
    color: '#4ECDC4',
    path: 'M 380 220 L 600 220 L 600 340 L 380 340 Z'
  },
  southeast_gulf: { 
    x: 500, y: 300, width: 150, height: 100, 
    color: '#45B7D1',
    path: 'M 500 300 L 650 300 L 650 400 L 500 400 Z'
  },
  midatlantic: { 
    x: 550, y: 180, width: 150, height: 140, 
    color: '#96CEB4',
    path: 'M 550 180 L 700 180 L 700 320 L 550 320 Z'
  },
  new_england_northern_tier: { 
    x: 600, y: 50, width: 200, height: 180, 
    color: '#FFEAA7',
    path: 'M 600 50 L 800 50 L 800 230 L 600 230 Z'
  }
};

export default function RegionMap({ selectedRegion, onRegionSelect }) {
  return (
    <div className="region-map-container">
      <div className="region-map-label">Select Your Region:</div>
      <div className="region-map-wrapper">
        <svg 
          viewBox="0 0 800 400" 
          className="region-map-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background USA outline (simplified) */}
          <rect x="0" y="0" width="800" height="400" fill="#f0f0f0" stroke="#ddd" strokeWidth="2" rx="4"/>
          
          {/* Region areas */}
          {Object.entries(regionCoordinates).map(([key, coords]) => {
            const isSelected = selectedRegion === key;
            const regionInfo = regionsData[key];
            
            return (
              <g key={key}>
                <path
                  d={coords.path}
                  fill={isSelected ? coords.color : coords.color + '80'}
                  stroke={isSelected ? '#333' : '#999'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeDasharray={isSelected ? '0' : '4,4'}
                  className="region-area"
                  onClick={() => onRegionSelect(key)}
                  style={{ cursor: 'pointer' }}
                />
                <text
                  x={coords.x + coords.width / 2}
                  y={coords.y + coords.height / 2}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill={isSelected ? '#fff' : '#333'}
                  fontSize="11"
                  fontWeight={isSelected ? 'bold' : '600'}
                  pointerEvents="none"
                  className="region-label"
                >
                  {regionInfo.label.split('/')[0].trim()}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
      <div className="region-map-legend">
        <div className="selected-region-info">
          {selectedRegion && (
            <strong>{regionsData[selectedRegion]?.label}</strong>
          )}
        </div>
      </div>
    </div>
  );
}

