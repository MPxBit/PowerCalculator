'use client';

import { useState, useEffect, useRef } from 'react';
import ApplianceSelector from '../components/ApplianceSelector';
import { calculateBatteryRequirements } from '../lib/calculations';
import appliancesData from '../data/appliances.json';
import solarData from '../data/solar.json';

export default function HomePage() {
  const [selectedAppliances, setSelectedAppliances] = useState([]);
  const [usageData, setUsageData] = useState({});
  const [results, setResults] = useState(null);
  const [solarPanels, setSolarPanels] = useState(0);
  const [sunCondition, setSunCondition] = useState('sunny');
  const [hasGenerator, setHasGenerator] = useState(false);
  const [hasDCCharger, setHasDCCharger] = useState(false);
  const isInitialMount = useRef(true);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('rvCalculator_selectedAppliances');
    const savedUsage = localStorage.getItem('rvCalculator_usageData');
    const savedSolar = localStorage.getItem('rvCalculator_solarPanels');
    const savedSunCondition = localStorage.getItem('rvCalculator_sunCondition');
    
    if (saved) {
      try {
        setSelectedAppliances(JSON.parse(saved));
      } catch (e) {
        console.error('Error loading saved appliances:', e);
      }
    }

    if (savedUsage) {
      try {
        setUsageData(JSON.parse(savedUsage));
      } catch (e) {
        console.error('Error loading saved usage data:', e);
      }
    }

    if (savedSolar) {
      setSolarPanels(parseInt(savedSolar) || 0);
    }

    if (savedSunCondition) {
      setSunCondition(savedSunCondition);
    }

    const savedHasGenerator = localStorage.getItem('rvCalculator_hasGenerator');
    const savedHasDCCharger = localStorage.getItem('rvCalculator_hasDCCharger');
    if (savedHasGenerator) {
      setHasGenerator(savedHasGenerator === 'true');
    }
    if (savedHasDCCharger) {
      setHasDCCharger(savedHasDCCharger === 'true');
    }
  }, []);

  // Calculate results whenever inputs change
  useEffect(() => {
    if (selectedAppliances.length === 0 && isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    if (selectedAppliances.length === 0) {
      setResults(null);
      return;
    }

    try {
      // Merge appliances with usage data
      const appliancesWithUsage = selectedAppliances.map(item => {
        const defaultHours = item.appliance.hoursPerDay || 
                             (item.appliance.needsDutyCycle ? 24 : 1);
        const usageInfo = usageData[item.appliance.id] || {
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

      // Charging config based on user selections
      const chargingConfig = {
        orionAmps: hasDCCharger ? 50 : 0,
        hasGenerator: hasGenerator
      };

      // Solar config based on slider
      const solarConfig = {
        hasSolar: solarPanels > 0,
        solarWatts: solarPanels * 110,
        sunCondition: sunCondition
      };

      const formData = {
        selectedAppliances: appliancesWithUsage,
        solarConfig: solarConfig,
        chargingConfig: chargingConfig
      };

      const calculatedResults = calculateBatteryRequirements(formData);
      setResults(calculatedResults);
    } catch (e) {
      console.error('Error calculating results:', e);
    }
  }, [selectedAppliances, usageData, solarPanels, sunCondition, hasGenerator, hasDCCharger]);

  const handleSelectionChange = (selected) => {
    setSelectedAppliances(selected);
    localStorage.setItem('rvCalculator_selectedAppliances', JSON.stringify(selected));
  };

  const handleUsageChange = (usage) => {
    setUsageData(usage);
    localStorage.setItem('rvCalculator_usageData', JSON.stringify(usage));
  };

  const handleSolarPanelsChange = (panels) => {
    setSolarPanels(panels);
    localStorage.setItem('rvCalculator_solarPanels', panels.toString());
  };

  const handleSunConditionChange = (condition) => {
    setSunCondition(condition);
    localStorage.setItem('rvCalculator_sunCondition', condition);
  };

  const handleGeneratorToggle = () => {
    const newValue = !hasGenerator;
    setHasGenerator(newValue);
    localStorage.setItem('rvCalculator_hasGenerator', newValue.toString());
  };

  const handleDCChargerToggle = () => {
    const newValue = !hasDCCharger;
    setHasDCCharger(newValue);
    localStorage.setItem('rvCalculator_hasDCCharger', newValue.toString());
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the calculator? All your selections will be cleared.')) {
      localStorage.removeItem('rvCalculator_selectedAppliances');
      localStorage.removeItem('rvCalculator_usageData');
      localStorage.removeItem('rvCalculator_solarPanels');
      localStorage.removeItem('rvCalculator_sunCondition');
      localStorage.removeItem('rvCalculator_hasGenerator');
      localStorage.removeItem('rvCalculator_hasDCCharger');
      setSelectedAppliances([]);
      setUsageData({});
      setSolarPanels(0);
      setSunCondition('sunny');
      setHasGenerator(false);
      setHasDCCharger(false);
      setResults(null);
    }
  };

  const currentSolarWatts = solarPanels * 110;

  return (
    <div className="single-page-container">
      <div className="page-header">
        <h1>RV Power System Calculator</h1>
        <button onClick={handleReset} className="button secondary reset-button">
          Reset Calculator
        </button>
      </div>

      <div className="two-column-layout">
        {/* Left Column: Appliance Selection */}
        <div className="left-column">
          {/* Power Requirements at Top */}
          {results && (
            <div className="power-requirements-card">
              <h2 className="section-title">Power Requirements</h2>
              <div className="power-requirements-grid">
                <div className="power-item">
                  <div className="power-label">Running Watts</div>
                  <div className="power-value">{results.runningWatts.toLocaleString()} W</div>
                </div>
                <div className="power-item">
                  <div className="power-label">Starting Watts</div>
                  <div className="power-value">{results.startingWatts.toLocaleString()} W</div>
                </div>
                <div className="power-item">
                  <div className="power-label">Daily Consumption</div>
                  <div className="power-value">{results.dailyAmpHours.toLocaleString()} Ah</div>
                </div>
              </div>
            </div>
          )}

          {/* Appliance Selector */}
          <ApplianceSelector
            selectedAppliances={selectedAppliances}
            usageData={usageData}
            onSelectionChange={handleSelectionChange}
            onUsageChange={handleUsageChange}
          />
        </div>

        {/* Right Column: Results */}
        <div className="right-column">
          {results ? (
            <>
              {/* Solar System Info - One Row */}
              <div className="solar-summary-row">
                <div className="solar-summary-item">
                  <div className="solar-summary-label">Current Solar System</div>
                  <div className="solar-summary-value">{currentSolarWatts}W</div>
                </div>
                <div className="solar-summary-item">
                  <div className="solar-summary-label">Solar Contribution</div>
                  <div className="solar-summary-value">{results.solarAh.toLocaleString()} Ah</div>
                </div>
                <div className="solar-summary-item">
                  <div className="solar-summary-label">Energy Deficit</div>
                  <div className="solar-summary-value">{results.energyDeficitAh.toLocaleString()} Ah</div>
                </div>
              </div>

              {/* Sun Condition Toggle */}
              <div className="sun-condition-toggle-group">
                <label className="toggle-label">Sun Conditions:</label>
                <div className="toggle-switch">
                  <button
                    className={`toggle-button ${sunCondition === 'sunny' ? 'active' : ''}`}
                    onClick={() => handleSunConditionChange('sunny')}
                    type="button"
                  >
                    Sunny ({solarData.sunHours.sunny}h)
                  </button>
                  <button
                    className={`toggle-button ${sunCondition === 'overcast' ? 'active' : ''}`}
                    onClick={() => handleSunConditionChange('overcast')}
                    type="button"
                  >
                    Overcast ({solarData.sunHours.overcast}h)
                  </button>
                </div>
              </div>

              {/* Solar Panel Slider */}
              <div className="solar-slider-section">
                <label className="solar-slider-label">
                  Number of 110W Solar Panels: {solarPanels} ({solarPanels / 2} pairs)
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="2"
                    value={solarPanels}
                    onChange={(e) => handleSolarPanelsChange(parseInt(e.target.value))}
                    className="solar-panel-slider"
                  />
                  <div className="slider-labels">
                    <span>0 panels (0W)</span>
                    <span>10 panels (1,100W)</span>
                    <span>20 panels (2,200W)</span>
                  </div>
                </label>
                <p className="field-hint">
                  Add solar panels in pairs (2 panels = 220W, 4 panels = 440W, 6 panels = 660W, etc.)
                </p>
              </div>

              {/* Impact Metrics */}
              <div className="impact-metrics-section">
                <div className="impact-item highlight">
                  <div className="impact-label">Batteries Needed</div>
                  <div className="impact-value large">{results.batteriesNeeded}</div>
                  <div className="impact-note">Epoch 12V 460Ah LiFePO₄</div>
                </div>

                {/* Generator Box - Clickable */}
                <div 
                  className={`impact-item ${hasGenerator ? 'highlight' : 'clickable-question'}`}
                  onClick={handleGeneratorToggle}
                  style={{ cursor: 'pointer' }}
                >
                  {hasGenerator && results.generatorHoursPerDay > 0 ? (
                    <>
                      <div className="impact-label">Generator Run Time to 100%</div>
                      <div className="impact-value large">{results.generatorHoursPerDay.toLocaleString()}h</div>
                      <div className="impact-note">Honda EU3200i @ 120A</div>
                    </>
                  ) : (
                    <>
                      <div className="impact-label">Do you have a generator?</div>
                      <div className="impact-note">Click to enable</div>
                    </>
                  )}
                </div>

                {/* DC-DC Charger Box - Clickable */}
                <div 
                  className={`impact-item ${hasDCCharger ? 'highlight' : 'clickable-question'}`}
                  onClick={handleDCChargerToggle}
                  style={{ cursor: 'pointer' }}
                >
                  {hasDCCharger && results.orionAmps > 0 && results.driveHoursToFull > 0 ? (
                    <>
                      <div className="impact-label">Drive Time to 100%</div>
                      <div className="impact-value large">{results.driveHoursToFull.toLocaleString()}h</div>
                      <div className="impact-note">Orion XS @ {results.orionAmps}A</div>
                    </>
                  ) : (
                    <>
                      <div className="impact-label">Do you have a DC-DC Charger?</div>
                      <div className="impact-note">Click to enable</div>
                    </>
                  )}
                </div>
              </div>

              {/* Shore Power Charging */}
              <div className="shore-power-section">
                <h3 className="section-title">Shore Power Charging</h3>
                <div className="shore-power-grid">
                  {results.shorePowerHome15Hours > 0 && (
                    <div className="shore-power-item">
                      <div className="shore-power-label">120V Home Plug (15A)</div>
                      <div className="shore-power-value">{results.shorePowerHome15Hours.toLocaleString()}h</div>
                      <div className="shore-power-note">To charge from empty to full</div>
                    </div>
                  )}
                  
                  {results.shorePowerHome20Hours > 0 && (
                    <div className="shore-power-item">
                      <div className="shore-power-label">120V Home Plug (20A)</div>
                      <div className="shore-power-value">{results.shorePowerHome20Hours.toLocaleString()}h</div>
                      <div className="shore-power-note">To charge from empty to full</div>
                    </div>
                  )}
                  
                  {results.shorePowerCampground30Hours > 0 && (
                    <div className="shore-power-item">
                      <div className="shore-power-label">Campground 30A</div>
                      <div className="shore-power-value">{results.shorePowerCampground30Hours.toLocaleString()}h</div>
                      <div className="shore-power-note">To charge from empty to full</div>
                    </div>
                  )}
                  
                  {results.shorePowerCampground50Hours > 0 && (
                    <div className="shore-power-item">
                      <div className="shore-power-label">Campground 50A</div>
                      <div className="shore-power-value">{results.shorePowerCampground50Hours.toLocaleString()}h</div>
                      <div className="shore-power-note">To charge from empty to full</div>
                    </div>
                  )}
                </div>
                <p className="shore-power-hint">
                  Charging times account for average load during charging. Times assume Victron Multiplus 3k inverter/charger.
                </p>
              </div>

              {/* Battery Bank Details */}
              <div className="battery-details-section">
                <h3 className="section-title">Battery Bank Details</h3>
                <div className="battery-details-grid">
                  <div className="battery-detail-item">
                    <div className="battery-detail-label">Total Capacity</div>
                    <div className="battery-detail-value">{results.batteryBankTotalAh.toLocaleString()} Ah</div>
                  </div>
                  <div className="battery-detail-item">
                    <div className="battery-detail-label">Usable Capacity</div>
                    <div className="battery-detail-value">{results.batteryBankUsableAh.toLocaleString()} Ah</div>
                    <div className="battery-detail-note">90% usable ({results.usableAhPerBattery}Ah per battery)</div>
                  </div>
                </div>

                {results.batteryBankUsableAh < results.energyDeficitAh && (
                  <div className="warning-box">
                    <strong>⚠️ Warning:</strong> Your recommended battery bank ({results.batteryBankUsableAh.toLocaleString()} Ah usable) 
                    may be insufficient for your daily needs ({results.energyDeficitAh.toLocaleString()} Ah).
                  </div>
                )}

                {results.batteryBankUsableAh >= results.energyDeficitAh && (
                  <div className="success-box">
                    <strong>✓ Good:</strong> Your recommended battery bank ({results.batteryBankUsableAh.toLocaleString()} Ah usable) 
                    can meet your daily energy needs ({results.energyDeficitAh.toLocaleString()} Ah).
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="no-results-message">
              <p>Select appliances on the left to see power system recommendations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
