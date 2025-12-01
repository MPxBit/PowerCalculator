'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import ResultsCard from '../../components/ResultsCard';
import { calculateBatteryRequirements } from '../../lib/calculations';
import appliancesData from '../../data/appliances.json';

export default function ResultsPage() {
  const router = useRouter();
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [solarPanels, setSolarPanels] = useState(0); // Number of 110W panels (added in pairs: 0, 2, 4, 6, etc.)
  const [region, setRegion] = useState('desert_southwest');
  const [season, setSeason] = useState('annual');
  const isInitialMount = useRef(true);

  const calculateResults = (solarPanelCount, reg, seas) => {
    // Load all form data from localStorage
    const selectedAppliancesData = localStorage.getItem('rvCalculator_selectedAppliances');
    const usageData = localStorage.getItem('rvCalculator_usageData');

    if (!selectedAppliancesData || !usageData) {
      setError('Missing form data. Please complete all steps.');
      return;
    }

    try {
      const selectedAppliances = JSON.parse(selectedAppliancesData);
      const usage = JSON.parse(usageData);

      // Merge appliances with usage data
      const appliancesWithUsage = selectedAppliances.map(item => {
        // Use hoursPerDay from appliance if specified (for 24h items)
        const defaultHours = item.appliance.hoursPerDay || (item.appliance.needsDutyCycle ? 24 : 1);
        const usageInfo = usage[item.appliance.id] || {
          hoursPerDay: defaultHours,
          dutyCycle: item.appliance.defaultDutyCycle || 1.0
        };

        return {
          appliance: item.appliance,
          quantity: item.quantity || 1,
          hoursPerDay: usageInfo.hoursPerDay,
          dutyCycle: usageInfo.dutyCycle
        };
      });

      // Load battery and charging configs from localStorage
      const savedBattery = localStorage.getItem('rvCalculator_batteryConfig');
      const savedCharging = localStorage.getItem('rvCalculator_chargingConfig');
      const savedSolar = localStorage.getItem('rvCalculator_solarConfig');
      
      const batteryConfig = savedBattery ? JSON.parse(savedBattery) : { batteryCount: 1 };
      const chargingConfig = savedCharging ? JSON.parse(savedCharging) : {
        orionAmps: 50,
        hasGenerator: true
      };
      
      // Solar config from saved or use slider (for backward compatibility)
      let solarConfig;
      if (savedSolar) {
        solarConfig = JSON.parse(savedSolar);
        // Migrate old sunCondition to region/season if needed
        if (solarConfig.sunCondition && !solarConfig.region) {
          // Default to desert_southwest for old 'sunny', or use annual average
          solarConfig.region = 'desert_southwest';
          solarConfig.season = 'annual';
          delete solarConfig.sunCondition;
        }
      } else {
        solarConfig = {
          solarWatts: solarPanelCount * 110, // 110W per panel (backward compat)
          region: reg || 'desert_southwest',
          season: seas || 'annual'
        };
      }

      // Perform calculations
      const formData = {
        selectedAppliances: appliancesWithUsage,
        solarConfig: solarConfig,
        batteryConfig: batteryConfig,
        chargingConfig: chargingConfig
      };

      const calculatedResults = calculateBatteryRequirements(formData);
      setResults(calculatedResults);
      setError(null);
    } catch (e) {
      console.error('Error calculating results:', e);
      setError('Error calculating results. Please try again.');
    }
  };

  useEffect(() => {
    // Load saved solar panel count if available
    const savedSolar = localStorage.getItem('rvCalculator_solarPanels');
    const savedSolarConfig = localStorage.getItem('rvCalculator_solarConfig');
    if (savedSolar) {
      setSolarPanels(parseInt(savedSolar) || 0);
    }
    if (savedSolarConfig) {
      try {
        const solarConfig = JSON.parse(savedSolarConfig);
        if (solarConfig.region) setRegion(solarConfig.region);
        if (solarConfig.season) setSeason(solarConfig.season);
      } catch (e) {
        console.error('Error loading solar config:', e);
      }
    }

    // Calculate initial results
    calculateResults(savedSolar ? parseInt(savedSolar) || 0 : 0, region, season);
  }, []);

  useEffect(() => {
    // Skip recalculating on initial mount (handled by first useEffect)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Recalculate when solar panels, region, or season changes
    calculateResults(solarPanels, region, season);
    localStorage.setItem('rvCalculator_solarPanels', solarPanels.toString());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanels, region, season]);

  const handleStartOver = () => {
    // Clear all localStorage data
    localStorage.removeItem('rvCalculator_selectedAppliances');
    localStorage.removeItem('rvCalculator_usageData');
    localStorage.removeItem('rvCalculator_solarPanels');
    router.push('/');
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the calculator? All your selections will be cleared.')) {
      handleStartOver();
    }
  };

  const handleBack = () => {
    router.push('/select-appliances');
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Step 2: Results</h1>
        <div className="progress-indicator">
          <span className="progress-step">1</span>
          <span className="progress-step active">2</span>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={handleStartOver} className="button primary">
            Start Over
          </button>
        </div>
      )}

      {results && (
        <ResultsCard 
          results={results} 
          solarPanels={solarPanels}
          region={region}
          season={season}
          onSolarPanelsChange={setSolarPanels}
          onRegionChange={setRegion}
          onSeasonChange={setSeason}
        />
      )}

      <div className="page-actions">
        <button onClick={handleBack} className="button secondary">
          Back
        </button>
        <button onClick={handleReset} className="button secondary">
          Reset Calculator
        </button>
        <button onClick={handleStartOver} className="button primary">
          Start Over
        </button>
      </div>
    </div>
  );
}
