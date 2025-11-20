'use client';

import { useState, useEffect, useRef } from 'react';
import batteryData from '../data/battery.json';

export default function BatteryForm({ batteryConfig = {}, onConfigChange }) {
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
    const cnt = Math.max(1, Math.min(10, parseInt(count) || 1));
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
          <label>
            Number of Batteries:
            <input
              type="number"
              min="1"
              max="10"
              value={config.batteryCount}
              onChange={(e) => handleBatteryCountChange(e.target.value)}
              className="battery-count-input"
            />
          </label>
          <p className="field-hint">
            Select how many Epoch 12V 460Ah batteries you want to use
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
