'use client';

import { useState, useEffect, useRef } from 'react';
import appliancesData from '../data/appliances.json';
import IdleDrawAccordion from './IdleDrawAccordion';
import debugLogger from '../lib/debug';

// Idle draw appliance IDs that should be preselected
const IDLE_DRAW_IDS = [
  'vitrifrigo_dp150i',
  'victron_3k_inverter_idle',
  'cerbo_gx',
  'smartshunt',
  'halo_rear_cam'
];

export default function ApplianceSelector({ selectedAppliances = [], usageData = {}, onSelectionChange, onUsageChange }) {
  debugLogger.log('ApplianceSelector', 'Component rendered', {
    selectedAppliancesCount: selectedAppliances.length,
    hasOnSelectionChange: !!onSelectionChange,
    hasOnUsageChange: !!onUsageChange
  });

  // Separate idle draw appliances from regular appliances
  const idleDrawAppliances = appliancesData.filter(a => IDLE_DRAW_IDS.includes(a.id));
  const regularAppliances = appliancesData.filter(a => !IDLE_DRAW_IDS.includes(a.id));

  const [selections, setSelections] = useState(() => {
    // Initialize from props or preselect idle draw items
    const initial = {};
    
    // If we have saved selections, use those
    if (selectedAppliances.length > 0) {
      selectedAppliances.forEach(item => {
        initial[item.appliance.id] = {
          selected: true,
          quantity: item.quantity || 1
        };
      });
    } else {
      // Otherwise, preselect idle draw items
      IDLE_DRAW_IDS.forEach(id => {
        initial[id] = {
          selected: true,
          quantity: 1
        };
      });
    }
    return initial;
  });

  const [usage, setUsage] = useState(() => {
    // Initialize usage from props or defaults
    const initial = {};
    
    if (selectedAppliances.length > 0) {
      selectedAppliances.forEach(item => {
        const key = item.appliance.id;
        const defaultHours = item.appliance.hoursPerDay || 
                             (item.appliance.needsDutyCycle ? 24 : 1);
        initial[key] = usageData[key] || {
          hoursPerDay: defaultHours,
          dutyCycle: item.appliance.defaultDutyCycle || 1.0
        };
      });
    } else {
      // Initialize idle draw items to 24 hours
      IDLE_DRAW_IDS.forEach(id => {
        const appliance = appliancesData.find(a => a.id === id);
        if (appliance) {
          initial[id] = {
            hoursPerDay: 24,
            dutyCycle: appliance.defaultDutyCycle || 1.0
          };
        }
      });
    }
    return initial;
  });

  const onSelectionChangeRef = useRef(onSelectionChange);
  const onUsageChangeRef = useRef(onUsageChange);
  
  useEffect(() => {
    onSelectionChangeRef.current = onSelectionChange;
    onUsageChangeRef.current = onUsageChange;
  }, [onSelectionChange, onUsageChange]);

  // Initialize idle draw items on first mount if not already loaded
  useEffect(() => {
    if (selectedAppliances.length === 0) {
      // Check if idle draw items are selected but parent hasn't been notified
      const hasAllIdleDraw = IDLE_DRAW_IDS.every(id => selections[id]?.selected);
      const hasUsageForAll = IDLE_DRAW_IDS.every(id => usage[id]);
      
      if (hasAllIdleDraw && hasUsageForAll) {
        // Trigger initial selection change to notify parent
        const selected = idleDrawAppliances.map(appliance => ({
          appliance,
          quantity: selections[appliance.id]?.quantity || 1
        }));
        if (onSelectionChangeRef.current) {
          onSelectionChangeRef.current(selected);
        }
        if (onUsageChangeRef.current) {
          onUsageChangeRef.current(usage);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    debugLogger.log('ApplianceSelector', 'useEffect: selections changed', {
      selectionsKeys: Object.keys(selections),
      selections
    });
    
    // Notify parent of selection changes
    const selected = appliancesData
      .filter(appliance => selections[appliance.id]?.selected)
      .map(appliance => ({
        appliance,
        quantity: selections[appliance.id]?.quantity || 1
      }));
    
    debugLogger.log('ApplianceSelector', 'Filtered selected appliances', {
      selectedCount: selected.length,
      selected: selected.map(s => ({
        id: s.appliance?.id,
        label: s.appliance?.label,
        quantity: s.quantity
      }))
    });
    
    if (onSelectionChangeRef.current) {
      debugLogger.log('ApplianceSelector', 'Calling onSelectionChange');
      try {
        onSelectionChangeRef.current(selected);
        debugLogger.log('ApplianceSelector', 'onSelectionChange called successfully');
      } catch (error) {
        debugLogger.error('ApplianceSelector', 'Error calling onSelectionChange', error);
      }
    }
  }, [selections]);

  useEffect(() => {
    // Notify parent of usage changes
    if (onUsageChangeRef.current && Object.keys(usage).length > 0) {
      debugLogger.log('ApplianceSelector', 'Calling onUsageChange', { usage });
      try {
        onUsageChangeRef.current(usage);
      } catch (error) {
        debugLogger.error('ApplianceSelector', 'Error calling onUsageChange', error);
      }
    }
  }, [usage]);

  const handleToggle = (applianceId) => {
    const appliance = appliancesData.find(a => a.id === applianceId);
    const isCurrentlySelected = selections[applianceId]?.selected || false;
    
    setSelections(prev => {
      const updated = {
        ...prev,
        [applianceId]: {
          ...prev[applianceId],
          selected: !isCurrentlySelected,
          quantity: prev[applianceId]?.quantity || 1
        }
      };
      return updated;
    });

    // Initialize usage when appliance is selected
    if (!isCurrentlySelected && appliance) {
      const defaultHours = appliance.hoursPerDay || 
                           (appliance.needsDutyCycle ? 24 : 1);
      setUsage(prev => ({
        ...prev,
        [applianceId]: {
          hoursPerDay: defaultHours,
          dutyCycle: appliance.defaultDutyCycle || 1.0
        }
      }));
    } else if (isCurrentlySelected) {
      // Remove usage when deselected
      setUsage(prev => {
        const updated = { ...prev };
        delete updated[applianceId];
        return updated;
      });
    }
  };

  const handleQuantityChange = (applianceId, quantity) => {
    const qty = Math.max(1, parseInt(quantity) || 1);
    setSelections(prev => ({
      ...prev,
      [applianceId]: {
        ...prev[applianceId],
        selected: true,
        quantity: qty
      }
    }));
  };

  const handleHoursChange = (applianceId, hours) => {
    const hrs = Math.max(0, parseFloat(hours) || 0);
    setUsage(prev => ({
      ...prev,
      [applianceId]: {
        ...prev[applianceId],
        hoursPerDay: hrs
      }
    }));
  };

  const handleDutyCycleChange = (applianceId, dutyCycle) => {
    const dc = Math.max(0, Math.min(1, parseFloat(dutyCycle) || 0));
    setUsage(prev => ({
      ...prev,
      [applianceId]: {
        ...prev[applianceId],
        dutyCycle: dc
      }
    }));
  };

  return (
    <div className="appliance-selector">
      <h2 className="form-title">Select Appliances & Usage</h2>
      <p className="form-subtitle">Select appliances and specify how long you'll use each per day</p>
      
      {/* Idle Draw Accordion */}
      <IdleDrawAccordion
        idleDrawAppliances={idleDrawAppliances}
        selections={selections}
        usage={usage}
        onToggle={handleToggle}
        onQuantityChange={handleQuantityChange}
        onHoursChange={handleHoursChange}
        onDutyCycleChange={handleDutyCycleChange}
      />
      
      {/* Regular Appliances */}
      <div className="appliance-list">
        {regularAppliances.map(appliance => {
          const isSelected = selections[appliance.id]?.selected || false;
          const quantity = selections[appliance.id]?.quantity || 1;
          const defaultHours = appliance.hoursPerDay || 
                               (appliance.needsDutyCycle ? 24 : 1);
          const usageInfo = usage[appliance.id] || {
            hoursPerDay: defaultHours,
            dutyCycle: appliance.defaultDutyCycle || 1.0
          };
          
          return (
            <div key={appliance.id} className={`appliance-item ${isSelected ? 'selected' : ''}`}>
              <label className="appliance-checkbox">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleToggle(appliance.id)}
                />
                <span className="appliance-label">
                  {appliance.label}
                  <span className="wattage-info">
                    ({appliance.runningWatts}W running, {appliance.startingWatts}W starting)
                  </span>
                </span>
              </label>
              
              {isSelected && (
                <div className="appliance-usage-fields">
                  {appliance.hasQuantity && (
                    <div className="usage-field">
                      <label>
                        Quantity:
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => handleQuantityChange(appliance.id, e.target.value)}
                          className="quantity-field"
                        />
                      </label>
                    </div>
                  )}

                  <div className="usage-field">
                    <label>
                      Hours per day:
                      <input
                        type="number"
                        min="0"
                        max="24"
                        step="0.1"
                        value={usageInfo.hoursPerDay}
                        onChange={(e) => handleHoursChange(appliance.id, e.target.value)}
                        className="hours-input"
                      />
                    </label>
                  </div>

                  {appliance.needsDutyCycle && (
                    <div className="usage-field">
                      <label>
                        Duty Cycle: {Math.round(usageInfo.dutyCycle * 100)}%
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={usageInfo.dutyCycle}
                          onChange={(e) => handleDutyCycleChange(appliance.id, e.target.value)}
                          className="duty-cycle-slider"
                        />
                        <span className="duty-cycle-hint">
                          {appliance.id.includes('refrigerator') 
                            ? 'Refrigerators cycle on/off. Default: 40%'
                            : 'AC units cycle on/off. Default: 60%'}
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
