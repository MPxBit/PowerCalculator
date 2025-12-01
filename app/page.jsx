'use client';

import { useState, useEffect, useRef } from 'react';
import ApplianceSelector from '../components/ApplianceSelector';
import { calculateBatteryRequirements, getMinSolutionSuggestion, getDeficitAfterAddingSolar, getDeficitAfterAddingBattery } from '../lib/calculations';
import batteryData from '../data/battery.json';
import appliancesData from '../data/appliances.json';
import regionsData from '../data/regions.json';
import { getPeakSunHours } from '../lib/calculations';
import RegionGrid from '../components/RegionGrid';
import SeasonSelector from '../components/SeasonSelector';

export default function HomePage() {
  const [selectedAppliances, setSelectedAppliances] = useState([]);
  const [usageData, setUsageData] = useState({});
  const [results, setResults] = useState(null);
  const [solarWatts, setSolarWatts] = useState(0); // Solar in 220W increments: 0, 220, 440, 660, 880, 1100, 1320
  const [batteryCount, setBatteryCount] = useState(1); // Batteries: 1, 2, or 3
  const [region, setRegion] = useState('desert_southwest');
  const [season, setSeason] = useState('annual');
  const [hasGenerator, setHasGenerator] = useState(false);
  const [hasDCCharger, setHasDCCharger] = useState(false);
  const isInitialMount = useRef(true);
  
  // Solar options in 220W increments
  const solarOptions = [220, 440, 660, 880, 1100, 1320];

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('rvCalculator_selectedAppliances');
    const savedUsage = localStorage.getItem('rvCalculator_usageData');
    const savedSolar = localStorage.getItem('rvCalculator_solarConfig');
    const savedBattery = localStorage.getItem('rvCalculator_batteryConfig');
    
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
      try {
        const solarConfig = JSON.parse(savedSolar);
        setSolarWatts(solarConfig.solarWatts || 0);
        // Migrate old sunCondition to region/season if needed
        if (solarConfig.sunCondition && !solarConfig.region) {
          setRegion('desert_southwest');
          setSeason('annual');
        } else {
          if (solarConfig.region) setRegion(solarConfig.region);
          if (solarConfig.season) setSeason(solarConfig.season);
        }
      } catch (e) {
        console.error('Error loading saved solar config:', e);
      }
    }

    if (savedBattery) {
      try {
        const batteryConfig = JSON.parse(savedBattery);
        setBatteryCount(batteryConfig.batteryCount || 1);
      } catch (e) {
        console.error('Error loading saved battery config:', e);
      }
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

      // Battery config
      const batteryConfig = { batteryCount: batteryCount };

      // Charging config based on user selections
      const chargingConfig = {
        orionAmps: hasDCCharger ? 50 : 0,
        hasGenerator: hasGenerator
      };

      // Solar config
      const solarConfig = {
        solarWatts: solarWatts,
        region: region,
        season: season
      };

      const formData = {
        selectedAppliances: appliancesWithUsage,
        solarConfig: solarConfig,
        batteryConfig: batteryConfig,
        chargingConfig: chargingConfig
      };

      const calculatedResults = calculateBatteryRequirements(formData);
      setResults(calculatedResults);
    } catch (e) {
      console.error('Error calculating results:', e);
    }
  }, [selectedAppliances, usageData, solarWatts, batteryCount, region, season, hasGenerator, hasDCCharger]);

  const handleSelectionChange = (selected) => {
    setSelectedAppliances(selected);
    localStorage.setItem('rvCalculator_selectedAppliances', JSON.stringify(selected));
  };

  const handleUsageChange = (usage) => {
    setUsageData(usage);
    localStorage.setItem('rvCalculator_usageData', JSON.stringify(usage));
  };

  const handleSolarWattsToggle = (watts) => {
    const newWatts = solarWatts === watts ? 0 : watts;
    setSolarWatts(newWatts);
    const solarConfig = { solarWatts: newWatts, region: region, season: season };
    localStorage.setItem('rvCalculator_solarConfig', JSON.stringify(solarConfig));
  };

  const handleBatteryCountToggle = (count) => {
    setBatteryCount(count);
    const batteryConfig = { batteryCount: count };
    localStorage.setItem('rvCalculator_batteryConfig', JSON.stringify(batteryConfig));
  };

  const handleRegionChange = (newRegion) => {
    setRegion(newRegion);
    // Update solar config with new region
    const solarConfig = { solarWatts: solarWatts, region: newRegion, season: season };
    localStorage.setItem('rvCalculator_solarConfig', JSON.stringify(solarConfig));
  };

  const handleSeasonChange = (newSeason) => {
    setSeason(newSeason);
    // Update solar config with new season
    const solarConfig = { solarWatts: solarWatts, region: region, season: newSeason };
    localStorage.setItem('rvCalculator_solarConfig', JSON.stringify(solarConfig));
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
      localStorage.removeItem('rvCalculator_solarConfig');
      localStorage.removeItem('rvCalculator_batteryConfig');
      localStorage.removeItem('rvCalculator_hasGenerator');
      localStorage.removeItem('rvCalculator_hasDCCharger');
      setSelectedAppliances([]);
      setUsageData({});
      setSolarWatts(0);
      setBatteryCount(1);
      setRegion('desert_southwest');
      setSeason('annual');
      setHasGenerator(false);
      setHasDCCharger(false);
      setResults(null);
    }
  };

  const currentSolarWatts = solarWatts;

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
              </div>

              {/* Region Grid and Season Selectors */}
              <div className="region-season-group">
                <RegionGrid 
                  selectedKey={region}
                  onSelect={handleRegionChange}
                />
                <SeasonSelector
                  regionKey={region}
                  selectedSeason={season}
                  onSelect={handleSeasonChange}
                />
              </div>

              {/* Solar Panel Toggle Buttons */}
              <div className="solar-toggle-section">
                <label className="field-label">Number of Solar Panels (220W increments):</label>
                <div className="toggle-button-group">
                  {solarOptions.map((watts) => {
                    const suggestion = results?.finalEnergyDeficitAh > 0 && solarWatts !== watts
                      ? (() => {
                          // Calculate deficit if we switch to this solar option
                          const sunHours = getPeakSunHours(region, season);
                          const currentSolarAh = solarWatts > 0 
                            ? (solarWatts * sunHours) / 12 
                            : 0;
                          const newSolarAh = (watts * sunHours) / 12;
                          const solarAhDifference = newSolarAh - currentSolarAh;
                          const deficitAfter = results.finalEnergyDeficitAh - solarAhDifference;
                          
                          if (deficitAfter <= 0) {
                            return { type: 'solves', message: 'This solves your deficit' };
                          } else {
                            return { 
                              type: 'helps', 
                              message: `Add this: Deficit becomes ${Math.abs(deficitAfter).toFixed(1)} Ah` 
                            };
                          }
                        })()
                      : null;
                    const suggestionClass = suggestion?.type === 'solves' ? 'solves-deficit' : 
                                           suggestion?.type === 'helps' ? 'suggested' : '';
                    
                    return (
                      <button
                        key={watts}
                        type="button"
                        className={`toggle-button ${solarWatts === watts ? 'active' : ''} ${suggestionClass}`}
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

              {/* Battery Toggle Buttons */}
              <div className="battery-toggle-section">
                <label className="field-label">Number of 460Ah Epoch Lithium Batteries:</label>
                <div className="toggle-button-group">
                  {[1, 2, 3].map((count) => {
                    const suggestion = results?.finalEnergyDeficitAh > 0 && batteryCount !== count && count > batteryCount
                      ? (() => {
                          const deficitAfter = getDeficitAfterAddingBattery(
                            results.finalEnergyDeficitAh,
                            batteryCount,
                            batteryData.usableAh
                          );
                          if (deficitAfter <= 0) {
                            return { type: 'solves', message: 'This solves your deficit' };
                          } else {
                            return { 
                              type: 'helps', 
                              message: `Add this: Deficit becomes ${Math.abs(deficitAfter).toFixed(1)} Ah` 
                            };
                          }
                        })()
                      : null;
                    const suggestionClass = suggestion?.type === 'solves' ? 'solves-deficit' : 
                                           suggestion?.type === 'helps' ? 'suggested' : '';
                    
                    return (
                      <button
                        key={count}
                        type="button"
                        className={`toggle-button ${batteryCount === count ? 'active' : ''} ${suggestionClass}`}
                        onClick={() => handleBatteryCountToggle(count)}
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

              {/* Impact Metrics */}
              <div className="impact-metrics-section">
                {(() => {
                  const suggestion = results.finalEnergyDeficitAh > 0 
                    ? getMinSolutionSuggestion(
                        results.finalEnergyDeficitAh,
                        solarWatts || 0,
                        batteryCount || 1,
                        region,
                        season
                      )
                    : null;
                  
                  return (
                    <div 
                      className={`impact-item ${results.finalEnergyDeficitAh > 0 ? 'deficit' : 'charge'}`}
                      data-tooltip={suggestion?.message || ''}
                    >
                      <div className="impact-label">{results.finalEnergyDeficitAh > 0 ? 'Deficit' : 'Charge'}</div>
                      <div className="impact-value large">{Math.abs(results.finalEnergyDeficitAh).toLocaleString()} Ah</div>
                      <div className="impact-note">After solar & batteries - Used for all charging calculations</div>
                    </div>
                  );
                })()}

                {/* Generator Box - Clickable */}
                <div 
                  className={`impact-item ${hasGenerator ? 'highlight' : 'clickable-question'}`}
                  onClick={handleGeneratorToggle}
                  style={{ cursor: 'pointer' }}
                >
                  {hasGenerator ? (
                    <>
                      <div className="impact-label">Generator Runtime</div>
                      <div className="impact-value large">{results.generatorHoursPerDay.toLocaleString()}h</div>
                      <div className="impact-note">Honda EU3200i @ 120A</div>
                      {results.chargeAmountNeededTo100 > 0 && (
                        <div className="impact-note-small">Charge {results.chargeAmountNeededTo100.toLocaleString()} Ah to 100%</div>
                      )}
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
                      {results.chargeAmountNeededTo100 > 0 && (
                        <div className="impact-note-small">Charge {results.chargeAmountNeededTo100.toLocaleString()} Ah to 100%</div>
                      )}
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
                {results.chargeAmountNeededTo100 > 0 && (
                  <div className="charge-amount-info">
                    <strong>Charge needed to reach 100%: {results.chargeAmountNeededTo100.toLocaleString()} Ah</strong>
                  </div>
                )}
                <div className="shore-power-grid">
                  {results.shorePowerHome15Hours > 0 && (
                    <div className="shore-power-item">
                      <div className="shore-power-label">120V Home Plug (15A)</div>
                      <div className="shore-power-value">{results.shorePowerHome15Hours.toLocaleString()}h</div>
                      <div className="shore-power-note">To charge {results.chargeAmountNeededTo100?.toLocaleString() || 'full capacity'} Ah to 100%</div>
                    </div>
                  )}
                  
                  {results.shorePowerHome20Hours > 0 && (
                    <div className="shore-power-item">
                      <div className="shore-power-label">120V Home Plug (20A)</div>
                      <div className="shore-power-value">{results.shorePowerHome20Hours.toLocaleString()}h</div>
                      <div className="shore-power-note">To charge {results.chargeAmountNeededTo100?.toLocaleString() || 'full capacity'} Ah to 100%</div>
                    </div>
                  )}
                  
                  {results.shorePowerCampground30Hours > 0 && (
                    <div className="shore-power-item">
                      <div className="shore-power-label">Campground 30A</div>
                      <div className="shore-power-value">{results.shorePowerCampground30Hours.toLocaleString()}h</div>
                      <div className="shore-power-note">To charge {results.chargeAmountNeededTo100?.toLocaleString() || 'full capacity'} Ah to 100%</div>
                    </div>
                  )}
                  
                  {results.shorePowerCampground50Hours > 0 && (
                    <div className="shore-power-item">
                      <div className="shore-power-label">Campground 50A</div>
                      <div className="shore-power-value">{results.shorePowerCampground50Hours.toLocaleString()}h</div>
                      <div className="shore-power-note">To charge {results.chargeAmountNeededTo100?.toLocaleString() || 'full capacity'} Ah to 100%</div>
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

                {results.finalEnergyDeficitAh > 0 && (
                  <div className="warning-box">
                    <strong>⚠️ Note:</strong> You have a remaining energy deficit of {results.finalEnergyDeficitAh.toLocaleString()} Ah 
                    after solar ({results.solarAh.toLocaleString()} Ah) and batteries ({results.batteryBankUsableAh.toLocaleString()} Ah usable). 
                    This deficit must be covered by charging sources (generator, DC-DC, or shore power).
                  </div>
                )}

                {results.finalEnergyDeficitAh <= 0 && (
                  <div className="success-box">
                    <strong>✓ Excellent:</strong> Your solar ({results.solarAh.toLocaleString()} Ah) and battery capacity 
                    ({results.batteryBankUsableAh.toLocaleString()} Ah usable) can fully meet your daily energy needs 
                    ({results.dailyAmpHours.toLocaleString()} Ah).
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
