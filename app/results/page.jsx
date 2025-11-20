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
  const [sunCondition, setSunCondition] = useState('sunny');
  const isInitialMount = useRef(true);

  const calculateResults = (solarPanelCount, sunCond) => {
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

      // Default charging config: 50A Orion XS and generator
      const chargingConfig = {
        orionAmps: 50,
        hasGenerator: true
      };

      // Solar config based on slider
      const solarConfig = {
        hasSolar: solarPanelCount > 0,
        solarWatts: solarPanelCount * 110, // 110W per panel
        sunCondition: sunCond
      };

      // Perform calculations
      const formData = {
        selectedAppliances: appliancesWithUsage,
        solarConfig: solarConfig,
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
    const savedSunCondition = localStorage.getItem('rvCalculator_sunCondition');
    if (savedSolar) {
      setSolarPanels(parseInt(savedSolar) || 0);
    }
    if (savedSunCondition) {
      setSunCondition(savedSunCondition);
    }

    // Calculate initial results
    calculateResults(savedSolar ? parseInt(savedSolar) || 0 : 0, savedSunCondition || 'sunny');
  }, []);

  useEffect(() => {
    // Skip recalculating on initial mount (handled by first useEffect)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Recalculate when solar panels or sun condition changes
    calculateResults(solarPanels, sunCondition);
    localStorage.setItem('rvCalculator_solarPanels', solarPanels.toString());
    localStorage.setItem('rvCalculator_sunCondition', sunCondition);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [solarPanels, sunCondition]);

  const handleStartOver = () => {
    // Clear all localStorage data
    localStorage.removeItem('rvCalculator_selectedAppliances');
    localStorage.removeItem('rvCalculator_usageData');
    localStorage.removeItem('rvCalculator_solarPanels');
    localStorage.removeItem('rvCalculator_sunCondition');
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
          sunCondition={sunCondition}
          onSolarPanelsChange={setSolarPanels}
          onSunConditionChange={setSunCondition}
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
