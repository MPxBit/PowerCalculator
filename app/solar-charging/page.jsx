'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SolarForm from '../../components/SolarForm';
import ChargingForm from '../../components/ChargingForm';
import SummaryCard from '../../components/SummaryCard';

export default function SolarChargingPage() {
  const router = useRouter();
  const [solarConfig, setSolarConfig] = useState({});
  const [chargingConfig, setChargingConfig] = useState({});
  const [selectedAppliances, setSelectedAppliances] = useState([]);
  const [usageData, setUsageData] = useState({});

  useEffect(() => {
    // Load solar config from localStorage
    const savedSolar = localStorage.getItem('rvCalculator_solarConfig');
    if (savedSolar) {
      try {
        const parsed = JSON.parse(savedSolar);
        setSolarConfig(parsed);
      } catch (e) {
        console.error('Error loading saved solar config:', e);
      }
    }

    // Load charging config from localStorage
    const savedCharging = localStorage.getItem('rvCalculator_chargingConfig');
    if (savedCharging) {
      try {
        const parsed = JSON.parse(savedCharging);
        setChargingConfig(parsed);
      } catch (e) {
        console.error('Error loading saved charging config:', e);
      }
    }

    // Load appliances and usage for summary
    const savedAppliances = localStorage.getItem('rvCalculator_selectedAppliances');
    const savedUsage = localStorage.getItem('rvCalculator_usageData');
    if (savedAppliances) {
      try {
        setSelectedAppliances(JSON.parse(savedAppliances));
      } catch (e) {
        console.error('Error loading appliances:', e);
      }
    }
    if (savedUsage) {
      try {
        setUsageData(JSON.parse(savedUsage));
      } catch (e) {
        console.error('Error loading usage data:', e);
      }
    }
  }, []);

  const handleSolarChange = (config) => {
    setSolarConfig(config);
    localStorage.setItem('rvCalculator_solarConfig', JSON.stringify(config));
  };

  const handleChargingChange = (config) => {
    setChargingConfig(config);
    localStorage.setItem('rvCalculator_chargingConfig', JSON.stringify(config));
  };

  const handleNext = () => {
    router.push('/results');
  };

  const handleBack = () => {
    router.push('/select-appliances');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Step 2: Solar & Charging</h1>
        <div className="progress-indicator">
          <span className="progress-step">1</span>
          <span className="progress-step active">2</span>
          <span className="progress-step">3</span>
        </div>
      </div>

      <SolarForm
        solarConfig={solarConfig}
        onConfigChange={handleSolarChange}
      />

      <ChargingForm
        chargingConfig={chargingConfig}
        onConfigChange={handleChargingChange}
      />

      <SummaryCard
        selectedAppliances={selectedAppliances}
        usageData={usageData}
        solarConfig={solarConfig}
        chargingConfig={chargingConfig}
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

