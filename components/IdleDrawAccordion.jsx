'use client';

import { useState } from 'react';

export default function IdleDrawAccordion({ 
  idleDrawAppliances, 
  selections, 
  usage,
  onToggle,
  onQuantityChange,
  onHoursChange,
  onDutyCycleChange
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="idle-draw-accordion">
      <button 
        className="accordion-header"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <span className="accordion-title">Idle Draw</span>
        <span className="accordion-icon">{isOpen ? '−' : '+'}</span>
      </button>
      
      {isOpen && (
        <div className="accordion-content">
          <p className="accordion-description">
            These items run 24 hours per day. You can modify their settings below.
          </p>
          <div className="appliance-list">
            {idleDrawAppliances.map(appliance => {
              const isSelected = selections[appliance.id]?.selected || false;
              const quantity = selections[appliance.id]?.quantity || 1;
              const defaultHours = appliance.hoursPerDay || 24;
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
                      onChange={() => onToggle(appliance.id)}
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
                              onChange={(e) => onQuantityChange(appliance.id, e.target.value)}
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
                            onChange={(e) => onHoursChange(appliance.id, e.target.value)}
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
                              onChange={(e) => onDutyCycleChange(appliance.id, e.target.value)}
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
      )}
    </div>
  );
}

