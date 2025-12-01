'use client';

import { useState, useEffect, useRef } from 'react';
import batteryData from '../data/battery.json';
import { getDeficitAfterAddingBattery } from '../lib/calculations';

export default function BatteryForm({ batteryConfig = {}, onConfigChange, finalEnergyDeficitAh = 0 }) {
  const [config, setConfig] = useState(() => ({
    batteryCount: batteryConfig.batteryCount || 1,
    inverterEfficiency: batteryConfig.inverterEfficiency || 0.9,
    ...batteryConfig
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

  const handleBatteryCountChange = (count) => {
    const cnt = Math.max(1, Math.min(3, parseInt(count) || 1));
    setConfig(prev => ({
      ...prev,
      batteryCount: cnt
    }));
  };

  const handleEfficiencyChange = (efficiency) => {
    const eff = Math.max(0, Math.min(1, parseFloat(efficiency) || 0.9));
    setConfig(prev => ({
      ...prev,
      inverterEfficiency: eff
    }));
  };

  const totalUsableAh = config.batteryCount * batteryData.usableAh;
  const totalAh = config.batteryCount * batteryData.totalAh;

  // Calculate which buttons would help solve the deficit
  const getButtonSuggestion = (count) => {
    if (finalEnergyDeficitAh <= 0) return null; // No deficit, no suggestions
    
    // If this button is already selected, don't suggest it
    if (config.batteryCount === count) return null;
    
    // Can't suggest if trying to go to a lower count
    if (count <= config.batteryCount) return null;
    
    // Calculate how many batteries we're adding
    const batteriesToAdd = count - config.batteryCount;
    const additionalCapacity = batteriesToAdd * batteryData.usableAh;
    const deficitAfterAdding = finalEnergyDeficitAh - additionalCapacity;
    
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
    <div className="battery-form">
      <h2 className="form-title">Battery System Configuration</h2>
      <p className="form-subtitle">Configure your battery bank settings</p>
      
      <div className="battery-info">
        <div className="info-item">
          <strong>Battery Type:</strong> {batteryData.batteryLabel}
        </div>
        <div className="info-item">
          <strong>Voltage:</strong> {batteryData.batteryVoltage}V (fixed)
        </div>
        <div className="info-item">
          <strong>Capacity per Battery:</strong> {batteryData.totalAh}Ah total, {batteryData.usableAh}Ah usable (90%)
        </div>
      </div>

      <div className="battery-fields">
        <div className="field-group">
          <label className="field-label">Number of 460Ah Epoch Lithium Batteries:</label>
          <div className="toggle-button-group">
            {[1, 2, 3].map((count) => {
              const suggestion = getButtonSuggestion(count);
              const suggestionClass = suggestion?.type === 'solves' ? 'solves-deficit' : 
                                     suggestion?.type === 'helps' ? 'suggested' : '';
              
              return (
                <button
                  key={count}
                  type="button"
                  className={`toggle-button ${config.batteryCount === count ? 'active' : ''} ${suggestionClass}`}
                  onClick={() => handleBatteryCountChange(count)}
                  data-tooltip={suggestion?.message || ''}
                >
                  {count} {count === 1 ? 'Battery' : 'Batteries'}
                </button>
              );
            })}
          </div>
          <p className="field-hint">
            Select the number of Epoch 12V 460Ah batteries (max 3)
          </p>
        </div>

        <div className="field-group">
          <label>
            Inverter Efficiency: {Math.round(config.inverterEfficiency * 100)}%
            <input
              type="range"
              min="0.7"
              max="1.0"
              step="0.01"
              value={config.inverterEfficiency}
              onChange={(e) => handleEfficiencyChange(e.target.value)}
              className="efficiency-slider"
            />
          </label>
          <p className="field-hint">Default: 90%</p>
        </div>

        <div className="battery-preview">
          <div className="preview-item">
            <div className="preview-label">Total Battery Bank Capacity:</div>
            <div className="preview-value">{totalAh} Ah</div>
          </div>
          <div className="preview-item">
            <div className="preview-label">Usable Battery Bank Capacity:</div>
            <div className="preview-value">{totalUsableAh} Ah</div>
          </div>
        </div>
      </div>
    </div>
  );
}
