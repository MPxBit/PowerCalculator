'use client';

import { useState, useEffect, useRef } from 'react';
import debugLogger from '../lib/debug';

export default function UsageForm({ selectedAppliances = [], usageData = {}, onUsageChange }) {
  debugLogger.log('UsageForm', 'Component rendered', {
    selectedAppliancesCount: selectedAppliances.length,
    usageDataKeys: Object.keys(usageData),
    hasOnUsageChange: !!onUsageChange
  });
  const [usage, setUsage] = useState(() => {
    // Initialize from props or defaults
    debugLogger.log('UsageForm', 'Initializing state', {
      selectedAppliancesCount: selectedAppliances.length,
      usageDataKeys: Object.keys(usageData)
    });
    
    const initial = {};
    selectedAppliances.forEach(item => {
      const key = item.appliance.id;
      // Use hoursPerDay from appliance if specified (for 24h items), otherwise use defaults
      const defaultHours = item.appliance.hoursPerDay || 
                           (item.appliance.needsDutyCycle ? 24 : 1);
      initial[key] = {
        hoursPerDay: usageData[key]?.hoursPerDay || defaultHours,
        dutyCycle: usageData[key]?.dutyCycle || 
                   item.appliance.defaultDutyCycle || 1.0
      };
      debugLogger.log('UsageForm', `Initialized usage for ${key}`, initial[key]);
    });
    
    debugLogger.log('UsageForm', 'State initialized', { initial });
    return initial;
  });

  const prevUsageRef = useRef(JSON.stringify(usage));
  const isInitialMount = useRef(true);
  const prevSelectedIdsRef = useRef(JSON.stringify(selectedAppliances.map(a => a.appliance.id)));

  // Update usage state when selectedAppliances changes (new appliances added)
  useEffect(() => {
    debugLogger.log('UsageForm', 'useEffect: selectedAppliances changed', {
      selectedAppliancesLength: selectedAppliances.length,
      selectedIds: selectedAppliances.map(a => a.appliance?.id || 'NO_ID')
    });

    if (selectedAppliances.length === 0) {
      debugLogger.log('UsageForm', 'No selected appliances, skipping update');
      return;
    }

    const currentIds = JSON.stringify(selectedAppliances.map(a => a.appliance?.id || 'NO_ID'));
    const idsChanged = currentIds !== prevSelectedIdsRef.current;
    
    debugLogger.log('UsageForm', 'Checking if IDs changed', {
      currentIds,
      prevIds: prevSelectedIdsRef.current,
      idsChanged
    });
    
    if (idsChanged) {
      debugLogger.log('UsageForm', 'IDs changed, updating usage state');
      prevSelectedIdsRef.current = currentIds;
      setUsage(prev => {
        debugLogger.log('UsageForm', 'setUsage callback called', { prev });
        const updated = { ...prev };
        selectedAppliances.forEach(item => {
          const key = item.appliance?.id;
          if (!key) {
            debugLogger.error('UsageForm', 'Appliance missing ID', { item });
            return;
          }
          if (!updated[key]) {
            updated[key] = {
              hoursPerDay: usageData[key]?.hoursPerDay || 
                           (item.appliance.needsDutyCycle ? 24 : 1),
              dutyCycle: usageData[key]?.dutyCycle || 
                         item.appliance.defaultDutyCycle || 1.0
            };
            debugLogger.log('UsageForm', `Added new usage entry for ${key}`, updated[key]);
          }
        });
        debugLogger.log('UsageForm', 'Updated usage state', { updated });
        return updated;
      });
    }
  }, [selectedAppliances, usageData]);

  // Store onUsageChange in a ref to avoid dependency issues
  const onUsageChangeRef = useRef(onUsageChange);
  useEffect(() => {
    onUsageChangeRef.current = onUsageChange;
  }, [onUsageChange]);

  // Only call onUsageChange when usage actually changes
  useEffect(() => {
    const currentUsageStr = JSON.stringify(usage);
    const usageChanged = currentUsageStr !== prevUsageRef.current;
    
    debugLogger.log('UsageForm', 'useEffect: usage changed check', {
      usageChanged,
      isInitialMount: isInitialMount.current,
      usageKeys: Object.keys(usage),
      hasCallback: !!onUsageChangeRef.current
    });
    
    if (usageChanged) {
      debugLogger.log('UsageForm', 'Usage changed, calling onUsageChange', { usage });
      prevUsageRef.current = currentUsageStr;
      if (onUsageChangeRef.current && Object.keys(usage).length > 0) {
        try {
          onUsageChangeRef.current(usage);
          debugLogger.log('UsageForm', 'onUsageChange called successfully');
        } catch (error) {
          debugLogger.error('UsageForm', 'Error calling onUsageChange', error);
        }
      } else {
        debugLogger.log('UsageForm', 'Skipping onUsageChange', {
          hasCallback: !!onUsageChangeRef.current,
          usageLength: Object.keys(usage).length
        });
      }
    } else if (isInitialMount.current) {
      debugLogger.log('UsageForm', 'Initial mount, calling onUsageChange', { usage });
      isInitialMount.current = false;
      if (onUsageChangeRef.current && Object.keys(usage).length > 0) {
        try {
          onUsageChangeRef.current(usage);
          debugLogger.log('UsageForm', 'Initial onUsageChange called successfully');
        } catch (error) {
          debugLogger.error('UsageForm', 'Error calling initial onUsageChange', error);
        }
      }
    }
  }, [usage]);

  const handleHoursChange = (applianceId, hours) => {
    debugLogger.log('UsageForm', 'handleHoursChange called', { applianceId, hours });
    const hrs = Math.max(0, parseFloat(hours) || 0);
    setUsage(prev => {
      const updated = {
        ...prev,
        [applianceId]: {
          ...prev[applianceId],
          hoursPerDay: hrs
        }
      };
      debugLogger.log('UsageForm', 'Hours updated', { applianceId, hrs, updated });
      return updated;
    });
  };

  const handleDutyCycleChange = (applianceId, dutyCycle) => {
    debugLogger.log('UsageForm', 'handleDutyCycleChange called', { applianceId, dutyCycle });
    const dc = Math.max(0, Math.min(1, parseFloat(dutyCycle) || 0));
    setUsage(prev => {
      const updated = {
        ...prev,
        [applianceId]: {
          ...prev[applianceId],
          dutyCycle: dc
        }
      };
      debugLogger.log('UsageForm', 'Duty cycle updated', { applianceId, dc, updated });
      return updated;
    });
  };

  if (selectedAppliances.length === 0) {
    debugLogger.log('UsageForm', 'Rendering empty state - no appliances selected');
    return (
      <div className="usage-form">
        <p>Please select appliances first.</p>
      </div>
    );
  }

  debugLogger.log('UsageForm', 'Rendering form', {
    selectedAppliancesCount: selectedAppliances.length,
    usageKeys: Object.keys(usage)
  });

  return (
    <div className="usage-form">
      <h2 className="form-title">Usage Duration and Patterns</h2>
      <p className="form-subtitle">Specify how long you'll use each appliance per day</p>
      
      <div className="usage-list">
        {selectedAppliances.map(item => {
          const key = item.appliance.id;
          const quantity = item.quantity || 1;
          const quantityLabel = quantity > 1 ? ` (${quantity}x)` : '';
          const defaultHours = item.appliance.hoursPerDay || 
                               (item.appliance.needsDutyCycle ? 24 : 1);
          const usageInfo = usage[key] || {
            hoursPerDay: defaultHours,
            dutyCycle: item.appliance.defaultDutyCycle || 1.0
          };

          return (
            <div key={key} className="usage-item">
              <div className="usage-header">
                <h3>{item.appliance.label}{quantityLabel}</h3>
              </div>
              
              <div className="usage-fields">
                <div className="field-group">
                  <label>
                    Hours per day:
                    <input
                      type="number"
                      min="0"
                      max="24"
                      step="0.1"
                      value={usageInfo.hoursPerDay}
                      onChange={(e) => handleHoursChange(key, e.target.value)}
                      className="hours-input"
                    />
                  </label>
                </div>

                {item.appliance.needsDutyCycle && (
                  <div className="field-group">
                    <label>
                      Duty Cycle: {Math.round(usageInfo.dutyCycle * 100)}%
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={usageInfo.dutyCycle}
                        onChange={(e) => handleDutyCycleChange(key, e.target.value)}
                        className="duty-cycle-slider"
                      />
                      <span className="duty-cycle-hint">
                        {item.appliance.id.includes('refrigerator') 
                          ? 'Refrigerators cycle on/off. Default: 40%'
                          : 'AC units cycle on/off. Default: 60%'}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
