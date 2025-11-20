'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ApplianceSelector from '../../components/ApplianceSelector';
import SummaryCard from '../../components/SummaryCard';
import DebugPanel from '../../components/DebugPanel';
import debugLogger from '../../lib/debug';

export default function SelectAppliancesPage() {
  const router = useRouter();
  const [selectedAppliances, setSelectedAppliances] = useState([]);
  const [usageData, setUsageData] = useState({});
  
  debugLogger.log('SelectAppliancesPage', 'Component rendered');

  useEffect(() => {
    debugLogger.log('SelectAppliancesPage', 'useEffect: Loading from localStorage');
    // Load from localStorage if available
    const saved = localStorage.getItem('rvCalculator_selectedAppliances');
    const savedUsage = localStorage.getItem('rvCalculator_usageData');
    
    debugLogger.log('SelectAppliancesPage', 'localStorage check', {
      hasSaved: !!saved,
      hasSavedUsage: !!savedUsage
    });
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        debugLogger.log('SelectAppliancesPage', 'Parsed saved appliances', {
          count: parsed.length,
          appliances: parsed.map(a => ({
            id: a.appliance?.id || 'NO_ID',
            label: a.appliance?.label || 'NO_LABEL',
            quantity: a.quantity
          }))
        });
        setSelectedAppliances(parsed);
      } catch (e) {
        debugLogger.error('SelectAppliancesPage', 'Error parsing saved appliances', e);
      }
    } else {
      // If no saved data, preselect idle draw items
      // This will be handled by ApplianceSelector component
    }

    if (savedUsage) {
      try {
        const parsed = JSON.parse(savedUsage);
        debugLogger.log('SelectAppliancesPage', 'Parsed saved usage data', {
          keys: Object.keys(parsed)
        });
        setUsageData(parsed);
      } catch (e) {
        debugLogger.error('SelectAppliancesPage', 'Error parsing saved usage data', e);
      }
    }
  }, []);

  const handleSelectionChange = (selected) => {
    debugLogger.log('SelectAppliancesPage', 'handleSelectionChange called', {
      selectedCount: selected.length,
      selected: selected.map(a => ({
        id: a.appliance?.id || 'NO_ID',
        label: a.appliance?.label || 'NO_LABEL',
        quantity: a.quantity
      }))
    });
    
    setSelectedAppliances(selected);
    // Save to localStorage
    try {
      const jsonString = JSON.stringify(selected);
      localStorage.setItem('rvCalculator_selectedAppliances', jsonString);
      debugLogger.log('SelectAppliancesPage', 'Saved to localStorage', {
        jsonLength: jsonString.length
      });
    } catch (e) {
      debugLogger.error('SelectAppliancesPage', 'Error saving to localStorage', e);
    }
  };

  const handleUsageChange = (usage) => {
    debugLogger.log('SelectAppliancesPage', 'handleUsageChange called', {
      usageKeys: Object.keys(usage)
    });
    
    setUsageData(usage);
    // Save to localStorage
    try {
      localStorage.setItem('rvCalculator_usageData', JSON.stringify(usage));
      debugLogger.log('SelectAppliancesPage', 'Usage data saved to localStorage');
    } catch (e) {
      debugLogger.error('SelectAppliancesPage', 'Error saving usage data to localStorage', e);
    }
  };

  const handleNext = () => {
    if (selectedAppliances.length === 0) {
      alert('Please select at least one appliance to continue.');
      return;
    }
    // Go directly to results (step 2)
    router.push('/results');
  };

  return (
    <div className="page-container">
      <DebugPanel />
      <div className="page-header">
        <h1>Step 1: Select Appliances</h1>
        <div className="progress-indicator">
          <span className="progress-step active">1</span>
          <span className="progress-step">2</span>
        </div>
      </div>

      <ApplianceSelector
        selectedAppliances={selectedAppliances}
        usageData={usageData}
        onSelectionChange={handleSelectionChange}
        onUsageChange={handleUsageChange}
      />

      <SummaryCard
        selectedAppliances={selectedAppliances}
        usageData={usageData}
      />

      <div className="page-actions">
        <button onClick={() => router.push('/')} className="button secondary">
          Back
        </button>
        <button onClick={handleNext} className="button primary">
          Calculate Results
        </button>
      </div>
    </div>
  );
}
