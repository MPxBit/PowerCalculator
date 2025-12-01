'use client';

import regionsData from '../data/regions.json';

const regionOrder = [
  "desert_southwest",
  "new_england_northern_tier",
  "mountain_west",
  "southern_plains_sunbelt",
  "pacific_northwest",
  "southeast_gulf",
  "midatlantic",
  "northern_pacific_coastal"
];

export default function RegionGrid({ selectedKey, onSelect }) {
  return (
    <div className="region-grid-container">
      <div className="region-grid-label">Select Your Region:</div>
      <div className="region-slider-wrapper">
        <div className="region-slider">
          {regionOrder.map((key) => {
            const region = regionsData[key];
            if (!region) return null;

            const selected = key === selectedKey;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className={`region-card-simple ${selected ? 'selected' : ''}`}
              >
                <div className="region-icon-wrapper-simple">
                  {region.icon ? (
                    <img
                      src={region.icon}
                      alt={region.label}
                      className="region-icon-simple"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="region-icon-placeholder-simple">
                      {region.label.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="region-label-simple">{region.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
