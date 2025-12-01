'use client';

import regionsData from '../data/regions.json';
import { getMinSolutionSuggestion, getPeakSunHours } from '../lib/calculations';

export default function ResultsCard({ 
  results, 
  solarPanels = 0, 
  region = 'desert_southwest',
  season = 'annual',
  onSolarPanelsChange,
  onRegionChange,
  onSeasonChange 
}) {
  if (!results) {
    return (
      <div className="results-card">
        <p>No results to display. Please complete all steps.</p>
      </div>
    );
  }

  const {
    runningWatts,
    startingWatts,
    dailyAmpHours,
    solarAh,
    energyDeficitAfterSolar,
    finalEnergyDeficitAh,
    batteryCount,
    batteryBankTotalAh,
    batteryBankUsableAh,
    requiredSolarWatts,
    generatorHoursPerDay,
    driveHoursToFull,
    systemVoltage,
    usableAhPerBattery,
    hasGenerator,
    orionAmps,
    solarWatts
  } = results;

  const currentSolarWatts = solarWatts || (solarPanels * 110);
  const seasons = ['winter', 'spring', 'summer', 'fall', 'annual'];

  return (
    <div className="results-card">
      <h2 className="results-title">Power System Recommendations</h2>
      
      <div className="results-section">
        <h3 className="section-title">Your Power Requirements</h3>
        <div className="results-grid">
          <div className="result-item">
            <div className="result-label">Total Running Watts</div>
            <div className="result-value">{runningWatts.toLocaleString()} W</div>
          </div>

          <div className="result-item">
            <div className="result-label">Total Starting Watts</div>
            <div className="result-value">{startingWatts.toLocaleString()} W</div>
            <div className="result-note">Peak surge requirement</div>
          </div>

          <div className="result-item">
            <div className="result-label">Daily Amp-Hour Consumption</div>
            <div className="result-value">{dailyAmpHours.toLocaleString()} Ah</div>
            <div className="result-note">At {systemVoltage}V system</div>
          </div>
        </div>
      </div>

      <div className="results-section">
        <h3 className="section-title">Solar Configuration & Impact</h3>
        <div className="solar-controls">
          <div className="field-group">
            <label>
              Number of 110W Solar Panels: {solarPanels} ({solarPanels / 2} pairs)
              <input
                type="range"
                min="0"
                max="20"
                step="2"
                value={solarPanels}
                onChange={(e) => onSolarPanelsChange && onSolarPanelsChange(parseInt(e.target.value))}
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

          <div className="field-group">
            <label>
              Region:
              <select
                value={region}
                onChange={(e) => onRegionChange && onRegionChange(e.target.value)}
                className="region-select"
              >
                {Object.entries(regionsData).map(([key, regionData]) => (
                  <option key={key} value={key}>{regionData.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="field-group">
            <label>
              Season:
              <select
                value={season}
                onChange={(e) => onSeasonChange && onSeasonChange(e.target.value)}
                className="season-select"
              >
                {seasons.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)} 
                    ({getPeakSunHours(region, s).toFixed(1)}h peak sun hours)
                  </option>
                ))}
              </select>
            </label>
          </div>

          {solarPanels > 0 && (
            <div className="solar-preview">
              <div className="preview-item">
                <div className="preview-label">Current Solar System:</div>
                <div className="preview-value">{currentSolarWatts}W</div>
              </div>
              <div className="preview-item">
                <div className="preview-label">Daily Solar Contribution:</div>
                <div className="preview-value">{solarAh.toLocaleString()} Ah</div>
                <div className="preview-note">
                  {currentSolarWatts}W × {getPeakSunHours(region, season).toFixed(1)}h ÷ 12V = {Math.round(solarAh)} Ah
                </div>
              </div>
            </div>
          )}

          {/* Impact Metrics - Update in real-time with solar */}
          <div className="solar-impact-grid">
            {(() => {
              const suggestion = finalEnergyDeficitAh > 0 
                ? getMinSolutionSuggestion(
                    finalEnergyDeficitAh,
                    solarWatts || 0,
                    batteryCount || 1,
                    region,
                    season
                  )
                : null;
              
              return (
                <div 
                  className={`impact-item ${finalEnergyDeficitAh > 0 ? 'deficit' : 'charge'}`}
                  data-tooltip={suggestion?.message || ''}
                >
                  <div className="impact-label">{finalEnergyDeficitAh > 0 ? 'Deficit' : 'Charge'}</div>
                  <div className="impact-value large">{Math.abs(finalEnergyDeficitAh).toLocaleString()} Ah</div>
                  <div className="impact-note">After solar & batteries - Used for all charging calculations</div>
                </div>
              );
            })()}

            {hasGenerator && (
              <div className="impact-item highlight">
                <div className="impact-label">Generator Runtime</div>
                <div className="impact-value large">{generatorHoursPerDay.toLocaleString()}h</div>
                <div className="impact-note">Honda EU3200i @ 120A</div>
                {results.chargeAmountNeededTo100 > 0 && (
                  <div className="impact-note-small">Charge {results.chargeAmountNeededTo100.toLocaleString()} Ah to 100%</div>
                )}
              </div>
            )}

            {orionAmps > 0 && driveHoursToFull > 0 && (
              <div className="impact-item highlight">
                <div className="impact-label">Drive Time to 100%</div>
                <div className="impact-value large">{driveHoursToFull.toLocaleString()}h</div>
                <div className="impact-note">Orion XS @ {orionAmps}A</div>
                {results.chargeAmountNeededTo100 > 0 && (
                  <div className="impact-note-small">Charge {results.chargeAmountNeededTo100.toLocaleString()} Ah to 100%</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="results-section">
        <h3 className="section-title">Battery Bank Details</h3>
        <div className="results-grid">
          <div className="result-item">
            <div className="result-label">Total Battery Bank Capacity</div>
            <div className="result-value">{batteryBankTotalAh.toLocaleString()} Ah</div>
            <div className="result-note">Total capacity</div>
          </div>

          <div className="result-item">
            <div className="result-label">Usable Battery Bank Capacity</div>
            <div className="result-value">{batteryBankUsableAh.toLocaleString()} Ah</div>
            <div className="result-note">90% usable ({usableAhPerBattery}Ah per battery)</div>
          </div>
        </div>

        {finalEnergyDeficitAh > 0 && (
          <div className="warning-box">
            <strong>⚠️ Note:</strong> You have a remaining energy deficit of {finalEnergyDeficitAh.toLocaleString()} Ah 
            after solar ({solarAh.toLocaleString()} Ah) and batteries ({batteryBankUsableAh.toLocaleString()} Ah usable). 
            This deficit must be covered by charging sources (generator, DC-DC, or shore power).
          </div>
        )}

        {finalEnergyDeficitAh <= 0 && (
          <div className="success-box">
            <strong>✓ Excellent:</strong> Your solar ({solarAh.toLocaleString()} Ah) and battery capacity 
            ({batteryBankUsableAh.toLocaleString()} Ah usable) can fully meet your daily energy needs 
            ({dailyAmpHours.toLocaleString()} Ah).
          </div>
        )}
      </div>

      {(() => {
        if (requiredSolarWatts <= 0 || currentSolarWatts >= requiredSolarWatts) return null;
        const additionalWatts = requiredSolarWatts - currentSolarWatts;
        const additionalPanels = Math.ceil(additionalWatts / 110);
        // Round up to nearest even number (pairs)
        const panelsInPairs = Math.ceil(additionalPanels / 2) * 2;
        const wattsInPairs = panelsInPairs * 110;
        return (
          <div className="results-section">
            <h3 className="section-title">Solar Recommendations</h3>
            <div className="results-grid">
              <div className="result-item highlight">
                <div className="result-label">Additional Solar Needed</div>
                <div className="result-value large">{panelsInPairs} panels</div>
                <div className="result-note">
                  {additionalWatts}W needed ({panelsInPairs / 2} pairs = {wattsInPairs}W)
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="results-notes">
        <h3>Important Notes:</h3>
        <ul>
          <li>
            <strong>Battery Specs:</strong> Calculations assume Epoch 12V 460Ah LiFePO₄ batteries 
            with {usableAhPerBattery}Ah usable capacity (90% depth of discharge).
          </li>
          <li>
            <strong>Inverter Efficiency:</strong> Calculations account for 90% inverter efficiency 
            when converting DC battery power to AC for appliances.
          </li>
          <li>
            <strong>Starting Watts:</strong> Your inverter must be able to handle the peak starting 
            wattage ({startingWatts.toLocaleString()} W) when appliances first turn on.
          </li>
          <li>
            <strong>Charging Sources:</strong> Assumes 50A Orion XS DC-DC charger and Honda EU3200i generator (120A charging).
          </li>
          {solarPanels > 0 && (
            <li>
              <strong>Solar:</strong> Solar contribution is calculated based on {solarPanels} panel(s) 
              ({currentSolarWatts}W total) and {getPeakSunHours(region, season).toFixed(1)}h peak sun hours ({regionsData[region]?.label || region}, {season}). 
              Actual production may vary based on weather, shading, and panel orientation.
            </li>
          )}
          {hasGenerator && (
            <li>
              <strong>Generator:</strong> {generatorHoursPerDay > 0 ? (
                <>You'll need to run your generator for {generatorHoursPerDay} hours 
                per day to make up the energy deficit. Consider adding more batteries or solar to reduce generator use.</>
              ) : (
                <>No generator runtime needed. Your solar and battery capacity fully meet your energy needs.</>
              )}
            </li>
          )}
          {driveHoursToFull > 0 && orionAmps > 0 && (
            <li>
              <strong>Alternator Charging:</strong> Drive time assumes continuous driving at {orionAmps}A charge rate. 
              Actual charging may be limited by alternator capacity and vehicle electrical load.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
