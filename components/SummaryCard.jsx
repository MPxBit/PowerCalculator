'use client';

import { calculateBatteryRequirements } from '../lib/calculations';
import { useState, useEffect } from 'react';

export default function SummaryCard({ selectedAppliances, usageData, solarConfig, chargingConfig }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!selectedAppliances || selectedAppliances.length === 0) {
      setSummary(null);
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

      const formData = {
        selectedAppliances: appliancesWithUsage,
        solarConfig: solarConfig || {},
        chargingConfig: chargingConfig || {}
      };

      const results = calculateBatteryRequirements(formData);
      setSummary(results);
    } catch (e) {
      console.error('Error calculating summary:', e);
      setSummary(null);
    }
  }, [selectedAppliances, usageData, solarConfig, chargingConfig]);

  if (!summary) return null;

  return (
    <div className="summary-card">
      <h3 className="summary-title">Summary</h3>
      <div className="summary-items">
        <div className="summary-item">
          <span className="summary-label">Batteries Needed:</span>
          <span className="summary-value">{summary.batteriesNeeded}</span>
        </div>
        {summary.requiredSolarWatts > 0 && (
          <div className="summary-item">
            <span className="summary-label">Solar Required:</span>
            <span className="summary-value">{summary.requiredSolarWatts}W</span>
          </div>
        )}
        {summary.generatorHoursPerDay > 0 && summary.hasGenerator && (
          <div className="summary-item">
            <span className="summary-label">Generator Hours/Day:</span>
            <span className="summary-value">{summary.generatorHoursPerDay}h</span>
          </div>
        )}
        {summary.driveHoursToFull > 0 && summary.orionAmps > 0 && (
          <div className="summary-item">
            <span className="summary-label">Drive Time to Full:</span>
            <span className="summary-value">{summary.driveHoursToFull}h</span>
          </div>
        )}
      </div>
    </div>
  );
}

