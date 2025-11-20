'use client';

import { useState, useEffect, useRef } from 'react';

export default function ChargingForm({ chargingConfig = {}, onConfigChange }) {
  const [config, setConfig] = useState(() => ({
    orionAmps: chargingConfig.orionAmps || 0,
    hasGenerator: chargingConfig.hasGenerator || false,
    ...chargingConfig
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

  const handleOrionChange = (amps) => {
    setConfig(prev => ({
      ...prev,
      orionAmps: parseInt(amps) || 0
    }));
  };

  const handleGeneratorToggle = (hasGenerator) => {
    setConfig(prev => ({
      ...prev,
      hasGenerator
    }));
  };

  return (
    <div className="charging-form">
      <h2 className="form-title">Charging Sources</h2>
      <p className="form-subtitle">Configure your alternator and generator charging</p>
      
      <div className="charging-fields">
        <div className="field-group">
          <label>
            Orion XS DC-DC Charger Amperage:
            <select
              value={config.orionAmps}
              onChange={(e) => handleOrionChange(e.target.value)}
              className="orion-select"
            >
              <option value="0">None / Not installed</option>
              <option value="30">30A</option>
              <option value="50">50A</option>
              <option value="70">70A</option>
            </select>
          </label>
          <p className="field-hint">
            Select the charge rate of your Orion XS DC-DC charger
          </p>
        </div>

        <div className="field-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={config.hasGenerator}
              onChange={(e) => handleGeneratorToggle(e.target.checked)}
              className="checkbox-input"
            />
            <span>Do you have Honda EU3200i generator?</span>
          </label>
          <p className="field-hint">
            Generator provides up to 120A DC charging via Victron inverter/charger
          </p>
        </div>
      </div>
    </div>
  );
}

