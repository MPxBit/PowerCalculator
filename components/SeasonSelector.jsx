'use client';

import regionsData from '../data/regions.json';

const seasons = [
  { key: "winter", label: "Winter", icon: "/assets/seasons/winter.svg" },
  { key: "spring", label: "Spring", icon: "/assets/seasons/spring.svg" },
  { key: "summer", label: "Summer", icon: "/assets/seasons/summer.svg" },
  { key: "fall", label: "Fall", icon: "/assets/seasons/fall.svg" },
  { key: "annual", label: "Annual", icon: null }
];

export default function SeasonSelector({ regionKey, selectedSeason, onSelect }) {
  const region = regionsData[regionKey];
  if (!region) return null;

  return (
    <div className="season-selector-container">
      <div className="season-selector-label">Select Season:</div>
      <div className="season-button-group">
        {seasons.map((s) => {
          const selected = s.key === selectedSeason;
          const value = region.psh[s.key];

          return (
            <button
              key={s.key}
              type="button"
              onClick={() => onSelect(s.key)}
              className={`season-button ${selected ? 'selected' : ''}`}
            >
              {s.icon && (
                <div className="season-icon-wrapper">
                  <img
                    src={s.icon}
                    alt={s.label}
                    className={`season-icon ${selected ? 'selected' : ''}`}
                  />
                </div>
              )}
              <span className="season-label">{s.label}</span>
              <span className={`season-hours ${selected ? 'selected' : ''}`}>
                {value.toFixed(1)} h / day
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
