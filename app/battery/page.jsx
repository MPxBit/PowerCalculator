'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import BatteryForm from '../../components/BatteryForm';

export default function BatteryPage() {
  const router = useRouter();
  const [batteryConfig, setBatteryConfig] = useState({});

  useEffect(() => {
    // Load battery config from localStorage
    const saved = localStorage.getItem('rvCalculator_batteryConfig');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setBatteryConfig(parsed);
      } catch (e) {
        console.error('Error loading saved battery config:', e);
      }
    }
  }, []);

  const handleConfigChange = (config) => {
    setBatteryConfig(config);
    // Save to localStorage
    localStorage.setItem('rvCalculator_batteryConfig', JSON.stringify(config));
  };

  const handleNext = () => {
    router.push('/solar-charging');
  };

  const handleBack = () => {
    router.push('/solar-charging');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Step 3: Battery Configuration</h1>
        <div className="progress-indicator">
          <span className="progress-step">1</span>
          <span className="progress-step">2</span>
          <span className="progress-step active">3</span>
          <span className="progress-step">4</span>
        </div>
      </div>

      <BatteryForm
        batteryConfig={batteryConfig}
        onConfigChange={handleConfigChange}
      />

      <div className="page-actions">
        <button onClick={handleBack} className="button secondary">
          Back
        </button>
        <button onClick={handleNext} className="button primary">
          Calculate Results
        </button>
      </div>
    </div>
  );
}
