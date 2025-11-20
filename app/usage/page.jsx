'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import UsageForm from '../../components/UsageForm';
import DebugPanel from '../../components/DebugPanel';
import debugLogger from '../../lib/debug';

export default function UsagePage() {
  const router = useRouter();
  const [selectedAppliances, setSelectedAppliances] = useState([]);
  const [usageData, setUsageData] = useState({});

  debugLogger.log('UsagePage', 'Component rendered');

  useEffect(() => {
    debugLogger.log('UsagePage', 'useEffect: Loading data from localStorage');
    
    // Load selected appliances from localStorage
    const saved = localStorage.getItem('rvCalculator_selectedAppliances');
    debugLogger.log('UsagePage', 'localStorage check', {
      hasSavedAppliances: !!saved,
      savedLength: saved?.length || 0
    });
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        debugLogger.log('UsagePage', 'Parsed selected appliances', {
          count: parsed.length,
          appliances: parsed.map(a => ({
            id: a.appliance?.id || 'NO_ID',
            label: a.appliance?.label || 'NO_LABEL',
            quantity: a.quantity
          }))
        });
        setSelectedAppliances(parsed);
      } catch (e) {
        debugLogger.error('UsagePage', 'Error parsing saved appliances', e);
      }
    } else {
      debugLogger.log('UsagePage', 'No saved appliances found in localStorage');
    }

    // Load usage data from localStorage
    const savedUsage = localStorage.getItem('rvCalculator_usageData');
    debugLogger.log('UsagePage', 'localStorage usage data check', {
      hasSavedUsage: !!savedUsage
    });
    
    if (savedUsage) {
      try {
        const parsed = JSON.parse(savedUsage);
        debugLogger.log('UsagePage', 'Parsed usage data', { keys: Object.keys(parsed) });
        setUsageData(parsed);
      } catch (e) {
        debugLogger.error('UsagePage', 'Error parsing saved usage data', e);
      }
    }
  }, []);

  const handleUsageChange = useCallback((usage) => {
    debugLogger.log('UsagePage', 'handleUsageChange called', {
      usageKeys: Object.keys(usage),
      usage
    });
    setUsageData(usage);
    // Save to localStorage
    try {
      localStorage.setItem('rvCalculator_usageData', JSON.stringify(usage));
      debugLogger.log('UsagePage', 'Usage data saved to localStorage');
    } catch (e) {
      debugLogger.error('UsagePage', 'Error saving usage data to localStorage', e);
    }
  }, []);

  const handleNext = () => {
    if (selectedAppliances.length === 0) {
      router.push('/select-appliances');
      return;
    }
    router.push('/battery');
  };

  const handleBack = () => {
    router.push('/select-appliances');
  };

  debugLogger.log('UsagePage', 'Rendering page', {
    selectedAppliancesCount: selectedAppliances.length,
    usageDataKeys: Object.keys(usageData),
    hasHandleUsageChange: !!handleUsageChange
  });

  return (
    <div className="page-container">
      <DebugPanel />
      <div className="page-header">
        <h1>Step 2: Usage Patterns</h1>
        <div className="progress-indicator">
          <span className="progress-step">1</span>
          <span className="progress-step active">2</span>
          <span className="progress-step">3</span>
          <span className="progress-step">4</span>
          <span className="progress-step">5</span>
        </div>
      </div>

      <div style={{ 
        padding: '15px', 
        marginBottom: '20px', 
        backgroundColor: '#fff3cd', 
        border: '1px solid #ffc107',
        borderRadius: '8px',
        fontSize: '14px'
      }}>
        <strong>Debug Info:</strong>
        <ul style={{ margin: '10px 0', paddingLeft: '20px' }}>
          <li>Selected Appliances: {selectedAppliances.length}</li>
          <li>Usage Data Keys: {Object.keys(usageData).join(', ') || 'none'}</li>
          <li>Has Callback: {handleUsageChange ? 'Yes' : 'No'}</li>
        </ul>
        <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
          Check the Debug Panel (bottom right) for detailed logs. Click "Download Logs" to save a log file.
        </div>
      </div>

      <UsageForm
        selectedAppliances={selectedAppliances}
        usageData={usageData}
        onUsageChange={handleUsageChange}
      />

      <div className="page-actions">
        <button onClick={handleBack} className="button secondary">
          Back
        </button>
        <button onClick={handleNext} className="button primary">
          Next: Battery Configuration
        </button>
      </div>
    </div>
  );
}
