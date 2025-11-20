'use client';

import { useState, useEffect, useRef } from 'react';
import solarData from '../data/solar.json';

export default function SolarForm({ solarConfig = {}, onConfigChange }) {
  const [config, setConfig] = useState(() => ({
    hasSolar: solarConfig.hasSolar || false,
    solarWatts: solarConfig.solarWatts || solarData.solarWatts,
    sunCondition: solarConfig.sunCondition || 'sunny',
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

  const handleSolarToggle = (hasSolar) => {
    setConfig(prev => ({
      ...prev,
      hasSolar
    }));
  };

  const handleSolarWattsChange = (watts) => {
    const w = Math.max(0, parseFloat(watts) || 0);
    setConfig(prev => ({
      ...prev,
      solarWatts: w
    }));
  };

  const handleSunConditionChange = (condition) => {
    setConfig(prev => ({
      ...prev,
      sunCondition: condition
    }));
  };

  const calculateSolarAh = () => {
    if (!config.hasSolar) return 0;
    const sunHours = solarData.sunHours[config.sunCondition] || solarData.sunHours.sunny;
    return (config.solarWatts * sunHours) / 12; // 12V system
  };

  const solarAh = calculateSolarAh();

  return (
    <div className="solar-form">
      <h2 className="form-title">Solar Configuration (Optional)</h2>
      <p className="form-subtitle">If you already have solar, enter your system details. The app will calculate what you need.</p>
      
      <div className="solar-fields">
        <div className="field-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.hasSolar}
              onChange={(e) => handleSolarToggle(e.target.checked)}
              className="checkbox-input"
            />
            <span>I have solar panels installed</span>
          </label>
        </div>

        {config.hasSolar && (
          <>
            <div className="field-group">
              <label>
                Solar Panel Wattage:
                <input
                  type="number"
                  min="0"
                  step="10"
                  value={config.solarWatts}
                  onChange={(e) => handleSolarWattsChange(e.target.value)}
                  className="solar-watts-input"
                />
                <span className="input-unit">W</span>
              </label>
              <p className="field-hint">
                Total wattage of your solar panel system
              </p>
            </div>

            <div className="field-group">
              <label>
                Sun Conditions:
                <select
                  value={config.sunCondition}
                  onChange={(e) => handleSunConditionChange(e.target.value)}
                  className="sun-condition-select"
                >
                  <option value="sunny">Sunny Day ({solarData.sunHours.sunny}h sun hours)</option>
                  <option value="overcast">Overcast Day ({solarData.sunHours.overcast}h sun hours)</option>
                </select>
              </label>
            </div>

            <div className="solar-preview">
              <div className="preview-item">
                <div className="preview-label">Estimated Daily Solar Contribution:</div>
                <div className="preview-value">{Math.round(solarAh)} Ah</div>
                <div className="preview-note">
                  {config.solarWatts}W × {solarData.sunHours[config.sunCondition]}h ÷ 12V = {Math.round(solarAh)} Ah
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
