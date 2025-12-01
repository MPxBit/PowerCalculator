'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SolarForm from '../../components/SolarForm';
import BatteryForm from '../../components/BatteryForm';
import ChargingForm from '../../components/ChargingForm';
import SummaryCard from '../../components/SummaryCard';
import { calculateBatteryRequirements } from '../../lib/calculations';
import { calculateBatteryRequirements } from '../../lib/calculations';

export default function SolarChargingPage() {
  const router = useRouter();
  const [solarConfig, setSolarConfig] = useState({});
  const [batteryConfig, setBatteryConfig] = useState({});
  const [chargingConfig, setChargingConfig] = useState({});
  const [selectedAppliances, setSelectedAppliances] = useState([]);
  const [usageData, setUsageData] = useState({});
  const [finalEnergyDeficitAh, setFinalEnergyDeficitAh] = useState(0);

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

    // Load battery config from localStorage
    const savedBattery = localStorage.getItem('rvCalculator_batteryConfig');
    if (savedBattery) {
      try {
        const parsed = JSON.parse(savedBattery);
        setBatteryConfig(parsed);
      } catch (e) {
        console.error('Error loading saved battery config:', e);
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

  const handleBatteryChange = (config) => {
    setBatteryConfig(config);
    localStorage.setItem('rvCalculator_batteryConfig', JSON.stringify(config));
  };

  const handleChargingChange = (config) => {
    setChargingConfig(config);
    localStorage.setItem('rvCalculator_chargingConfig', JSON.stringify(config));
  };

  // Calculate deficit for suggestions
  useEffect(() => {
    if (!selectedAppliances || selectedAppliances.length === 0) {
      setFinalEnergyDeficitAh(0);
      return;
    }

    try {
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
        batteryConfig: batteryConfig || {},
        chargingConfig: chargingConfig || {}
      };

      const results = calculateBatteryRequirements(formData);
      setFinalEnergyDeficitAh(results.finalEnergyDeficitAh || 0);
    } catch (e) {
      console.error('Error calculating deficit:', e);
      setFinalEnergyDeficitAh(0);
    }
  }, [selectedAppliances, usageData, solarConfig, batteryConfig, chargingConfig]);

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

      <SummaryCard
        selectedAppliances={selectedAppliances}
        usageData={usageData}
        solarConfig={solarConfig}
        batteryConfig={batteryConfig}
        chargingConfig={chargingConfig}
      />

      <SolarForm
        solarConfig={solarConfig}
        onConfigChange={handleSolarChange}
        finalEnergyDeficitAh={finalEnergyDeficitAh}
      />

      <BatteryForm
        batteryConfig={batteryConfig}
        onConfigChange={handleBatteryChange}
        finalEnergyDeficitAh={finalEnergyDeficitAh}
      />

      <ChargingForm
        chargingConfig={chargingConfig}
        onConfigChange={handleChargingChange}
      />

      <SummaryCard
        selectedAppliances={selectedAppliances}
        usageData={usageData}
        solarConfig={solarConfig}
        batteryConfig={batteryConfig}
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

