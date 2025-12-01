'use client';

import { useState, useEffect, useRef } from 'react';
import regionsData from '../data/regions.json';
import { getDeficitAfterAddingSolar, getPeakSunHours } from '../lib/calculations';
import RegionGrid from './RegionGrid';
import SeasonSelector from './SeasonSelector';

export default function SolarForm({ solarConfig = {}, onConfigChange, finalEnergyDeficitAh = 0 }) {
  // Solar options in 220W increments: 220, 440, 660, 880, 1100, 1320
  const solarOptions = [220, 440, 660, 880, 1100, 1320];
  const seasons = ['winter', 'spring', 'summer', 'fall', 'annual'];

  const [config, setConfig] = useState(() => ({
    solarWatts: solarConfig.solarWatts || 0,
    region: solarConfig.region || 'desert_southwest',
    season: solarConfig.season || 'annual',
    ...solarConfig
  }));

  const onConfigChangeRef = useRef(onConfigChange);
  useEffect(() => {
    onConfigChangeRef.current = onConfigChange;
  }, [onConfigChange]);

  useEffect(() => {
    if (onConfigChangeRef.current) {
      onConfigChangeRef.current(config);
    }
  }, [config]);

  const handleSolarWattsToggle = (watts) => {
    setConfig(prev => ({
      ...prev,
      solarWatts: prev.solarWatts === watts ? 0 : watts // Toggle: if already selected, deselect
    }));
  };

  const handleRegionChange = (region) => {
    setConfig(prev => ({
      ...prev,
      region: region
    }));
  };

  const handleSeasonChange = (season) => {
    setConfig(prev => ({
      ...prev,
      season: season
    }));
  };

  const calculateSolarAh = () => {
    if (!config.solarWatts || config.solarWatts <= 0) return 0;
    const sunHours = getPeakSunHours(config.region, config.season);
    return (config.solarWatts * sunHours) / 12; // 12V system
  };

  const solarAh = calculateSolarAh();

  // Calculate which buttons would help solve the deficit
  const getButtonSuggestion = (watts) => {
    if (finalEnergyDeficitAh <= 0) return null; // No deficit, no suggestions
    
    // If this button is already selected, don't suggest it
    if (config.solarWatts === watts) return null;
    
    // Calculate deficit if we switch to this solar option
    // We need to account for the fact that we're replacing current solar, not adding to it
    const sunHours = getPeakSunHours(config.region, config.season);
    const currentSolarAh = config.solarWatts > 0 
      ? (config.solarWatts * sunHours) / 12 
      : 0;
    const newSolarAh = (watts * sunHours) / 12;
    const solarAhDifference = newSolarAh - currentSolarAh;
    const deficitAfterAdding = finalEnergyDeficitAh - solarAhDifference;
    
    if (deficitAfterAdding <= 0) {
      return { type: 'solves', message: 'This solves your deficit' };
    } else {
      return { 
        type: 'helps', 
        message: `Add this: Deficit becomes ${Math.abs(deficitAfterAdding).toFixed(1)} Ah` 
      };
    }
  };

  return (
    <div className="solar-form">
      <h2 className="form-title">Solar Panels</h2>
      <p className="form-subtitle">Select your solar panel configuration (220W increments)</p>
      
      <div className="solar-fields">
        <div className="field-group">
          <label className="field-label">Number of Solar Panels:</label>
          <div className="toggle-button-group">
            {solarOptions.map((watts) => {
              const suggestion = getButtonSuggestion(watts);
              const suggestionClass = suggestion?.type === 'solves' ? 'solves-deficit' : 
                                     suggestion?.type === 'helps' ? 'suggested' : '';
              
              return (
                <button
                  key={watts}
                  type="button"
                  className={`toggle-button ${config.solarWatts === watts ? 'active' : ''} ${suggestionClass}`}
                  onClick={() => handleSolarWattsToggle(watts)}
                  data-tooltip={suggestion?.message || ''}
                >
                  {watts}W
                </button>
              );
            })}
          </div>
          <p className="field-hint">
            Select one option. Each increment represents 220W (2 panels × 110W each)
          </p>
        </div>

        <div className="region-season-group">
          <RegionGrid 
            selectedKey={config.region}
            onSelect={handleRegionChange}
          />
          <SeasonSelector
            regionKey={config.region}
            selectedSeason={config.season}
            onSelect={handleSeasonChange}
          />
        </div>

        {config.solarWatts > 0 && (
          <div className="solar-preview">
            <div className="preview-item">
              <div className="preview-label">Estimated Daily Solar Contribution:</div>
              <div className="preview-value">{Math.round(solarAh)} Ah</div>
              <div className="preview-note">
                {config.solarWatts}W × {getPeakSunHours(config.region, config.season).toFixed(1)}h ÷ 12V = {Math.round(solarAh)} Ah
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
