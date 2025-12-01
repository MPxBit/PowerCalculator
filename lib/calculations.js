/**
 * Calculation engine for RV Power System Sizing
 * Updated for Epoch 12V 460Ah battery, solar, and charging sources
 */

import batteryData from '../data/battery.json';
import solarData from '../data/solar.json';
import regionsData from '../data/regions.json';

/**
 * Calculate total running wattage
 * Sum of all selected appliances, weighted by duty cycle
 * @param {Array} selectedAppliances - Array of {appliance, quantity, hoursPerDay, dutyCycle}
 * @returns {number} Total running watts
 */
export function calculateRunningWatts(selectedAppliances) {
  return selectedAppliances.reduce((total, item) => {
    const quantity = item.quantity || 1;
    const dutyCycle = item.dutyCycle || 1.0;
    return total + (item.appliance.runningWatts * quantity * dutyCycle);
  }, 0);
}

/**
 * Calculate starting wattage requirement
 * Maximum cumulative start load
 * @param {Array} selectedAppliances - Array of {appliance, quantity}
 * @returns {number} Total starting watts required
 */
export function calculateStartingWatts(selectedAppliances) {
  // Normal case: max starting watts of all items
  return Math.max(
    ...selectedAppliances.map(item => {
      const quantity = item.quantity || 1;
      return (item.appliance.startingWatts || 0) * quantity;
    }),
    0
  );
}

/**
 * Convert watts to amps
 * @param {number} watts - Power in watts
 * @param {number} systemVoltage - Battery system voltage (12V fixed)
 * @returns {number} Current in amps
 */
export function wattsToAmps(watts, systemVoltage = 12) {
  return watts / systemVoltage;
}

/**
 * Calculate total daily amp-hours consumption
 * For each appliance: amp_hours = (running watts × hours used) / (battery voltage × inverter efficiency)
 * @param {Array} selectedAppliances - Array of {appliance, quantity, hoursPerDay, dutyCycle}
 * @param {number} systemVoltage - Battery system voltage (12V)
 * @param {number} inverterEfficiency - Inverter efficiency (0.0 to 1.0)
 * @returns {number} Total daily amp-hours
 */
export function calculateDailyAmpHours(selectedAppliances, systemVoltage = 12, inverterEfficiency = 0.9) {
  return selectedAppliances.reduce((total, item) => {
    const quantity = item.quantity || 1;
    const hoursPerDay = item.hoursPerDay || 0;
    const dutyCycle = item.dutyCycle || 1.0;
    
    // Effective running watts (accounting for duty cycle)
    const effectiveWatts = item.appliance.runningWatts * quantity * dutyCycle;
    
    // Amp-hours for this appliance
    const ampHours = (effectiveWatts * hoursPerDay) / (systemVoltage * inverterEfficiency);
    
    return total + ampHours;
  }, 0);
}

/**
 * Get peak sun hours for a region and season
 * @param {string} region - Region key (e.g., 'desert_southwest')
 * @param {string} season - Season ('winter', 'spring', 'summer', 'fall', 'annual')
 * @returns {number} Peak sun hours
 */
export function getPeakSunHours(region, season = 'annual') {
  if (!region || !regionsData[region]) {
    // Default to annual average for desert_southwest if invalid
    return regionsData.desert_southwest.psh.annual;
  }
  
  const regionData = regionsData[region];
  const psh = regionData.psh[season] || regionData.psh.annual;
  return psh;
}

/**
 * Calculate solar amp-hours contribution
 * @param {boolean} hasSolar - Whether user has solar
 * @param {number} solarWatts - Solar panel wattage
 * @param {string} region - Region key (e.g., 'desert_southwest')
 * @param {string} season - Season ('winter', 'spring', 'summer', 'fall', 'annual')
 * @returns {number} Daily solar amp-hours
 */
export function calculateSolarAh(hasSolar, solarWatts = 0, region = 'desert_southwest', season = 'annual') {
  if (!hasSolar || !solarWatts) return 0;
  
  const sunHours = getPeakSunHours(region, season);
  const solarAh = (solarWatts * sunHours) / batteryData.batteryVoltage;
  
  return solarAh;
}

/**
 * Calculate energy deficit after solar contribution
 * @param {number} dailyAh - Daily amp-hour consumption
 * @param {number} solarAh - Solar amp-hour contribution
 * @returns {number} Energy deficit in amp-hours (after solar)
 */
export function calculateEnergyDeficit(dailyAh, solarAh) {
  return Math.max(0, dailyAh - solarAh);
}

/**
 * Calculate final energy deficit after solar and battery capacity
 * @param {number} dailyAh - Daily amp-hour consumption
 * @param {number} solarAh - Solar amp-hour contribution
 * @param {number} batteryUsableAh - Total usable battery bank capacity
 * @returns {number} Final energy deficit in amp-hours (after solar and batteries)
 *                   Positive = deficit (needs charging), Negative = surplus (charge available)
 */
export function calculateFinalEnergyDeficit(dailyAh, solarAh, batteryUsableAh = 0) {
  const deficitAfterSolar = dailyAh - solarAh;
  return deficitAfterSolar - batteryUsableAh;
}

/**
 * Calculate number of batteries needed
 * @param {number} energyDeficitAh - Energy deficit in amp-hours
 * @param {number} usableAhPerBattery - Usable amp-hours per battery (414Ah for Epoch)
 * @returns {number} Number of batteries needed (rounded up)
 */
export function calculateBatteriesNeeded(energyDeficitAh, usableAhPerBattery = batteryData.usableAh) {
  if (energyDeficitAh <= 0) return 1; // At least 1 battery
  return Math.ceil(energyDeficitAh / usableAhPerBattery);
}

/**
 * Calculate required solar wattage to meet energy needs
 * @param {number} energyDeficitAh - Energy deficit in amp-hours
 * @param {string} region - Region key (e.g., 'desert_southwest')
 * @param {string} season - Season ('winter', 'spring', 'summer', 'fall', 'annual')
 * @returns {number} Required solar wattage
 */
export function calculateRequiredSolarWatts(energyDeficitAh, region = 'desert_southwest', season = 'annual') {
  if (energyDeficitAh <= 0) return 0;
  
  const sunHours = getPeakSunHours(region, season);
  // solarAh = (watts × sunHours) / 12V
  // watts = (solarAh × 12V) / sunHours
  const requiredWatts = (energyDeficitAh * batteryData.batteryVoltage) / sunHours;
  
  return Math.ceil(requiredWatts / 10) * 10; // Round up to nearest 10W
}

/**
 * Calculate minimum additional batteries needed to solve deficit
 * @param {number} deficitAh - Current energy deficit in amp-hours
 * @param {number} currentBatteryCount - Current number of batteries
 * @param {number} usableAhPerBattery - Usable amp-hours per battery (414Ah for Epoch)
 * @returns {number} Minimum additional batteries needed (0 if current batteries already solve it)
 */
export function calculateMinBatteriesToSolveDeficit(deficitAh, currentBatteryCount, usableAhPerBattery = batteryData.usableAh) {
  if (deficitAh <= 0) return 0; // No deficit, no batteries needed
  
  const currentBatteryCapacity = currentBatteryCount * usableAhPerBattery;
  const remainingDeficit = deficitAh - currentBatteryCapacity;
  
  if (remainingDeficit <= 0) return 0; // Current batteries already solve it
  
  // Calculate how many additional batteries are needed
  return Math.ceil(remainingDeficit / usableAhPerBattery);
}

/**
 * Calculate minimum additional solar needed to solve deficit (in 220W increments)
 * @param {number} deficitAh - Current energy deficit in amp-hours
 * @param {number} currentSolarWatts - Current solar wattage
 * @param {string} region - Region key (e.g., 'desert_southwest')
 * @param {string} season - Season ('winter', 'spring', 'summer', 'fall', 'annual')
 * @returns {number} Minimum additional solar wattage needed in 220W increments (0 if current solar already solves it)
 */
export function calculateMinSolarToSolveDeficit(deficitAh, currentSolarWatts, region = 'desert_southwest', season = 'annual') {
  if (deficitAh <= 0) return 0; // No deficit, no solar needed
  
  const sunHours = getPeakSunHours(region, season);
  const currentSolarAh = (currentSolarWatts * sunHours) / batteryData.batteryVoltage;
  const remainingDeficit = deficitAh - currentSolarAh;
  
  if (remainingDeficit <= 0) return 0; // Current solar already solves it
  
  // Calculate required solar wattage
  const requiredWatts = (remainingDeficit * batteryData.batteryVoltage) / sunHours;
  
  // Round up to nearest 220W increment
  const solarOptions = [220, 440, 660, 880, 1100, 1320];
  for (const watts of solarOptions) {
    if (watts >= requiredWatts) {
      return watts;
    }
  }
  
  // If required is more than max (1320W), return max
  return 1320;
}

/**
 * Calculate remaining deficit after adding one battery
 * @param {number} deficitAh - Current energy deficit in amp-hours
 * @param {number} currentBatteryCount - Current number of batteries
 * @param {number} usableAhPerBattery - Usable amp-hours per battery (414Ah for Epoch)
 * @returns {number} Remaining deficit after adding one battery
 */
export function getDeficitAfterAddingBattery(deficitAh, currentBatteryCount, usableAhPerBattery = batteryData.usableAh) {
  const newBatteryCount = currentBatteryCount + 1;
  if (newBatteryCount > 3) return deficitAh; // Can't add more than 3 batteries
  
  const newBatteryCapacity = newBatteryCount * usableAhPerBattery;
  return deficitAh - usableAhPerBattery; // Subtract one battery's capacity
}

/**
 * Calculate remaining deficit after adding solar
 * @param {number} deficitAh - Current energy deficit in amp-hours
 * @param {number} currentSolarWatts - Current solar wattage
 * @param {number} additionalWatts - Additional solar wattage to add
 * @param {string} region - Region key (e.g., 'desert_southwest')
 * @param {string} season - Season ('winter', 'spring', 'summer', 'fall', 'annual')
 * @returns {number} Remaining deficit after adding solar
 */
export function getDeficitAfterAddingSolar(deficitAh, currentSolarWatts, additionalWatts, region = 'desert_southwest', season = 'annual') {
  const sunHours = getPeakSunHours(region, season);
  const additionalSolarAh = (additionalWatts * sunHours) / batteryData.batteryVoltage;
  return deficitAh - additionalSolarAh;
}

/**
 * Get minimum solution suggestion for deficit
 * @param {number} deficitAh - Current energy deficit in amp-hours
 * @param {number} currentSolarWatts - Current solar wattage
 * @param {number} currentBatteryCount - Current number of batteries
 * @param {string} region - Region key (e.g., 'desert_southwest')
 * @param {string} season - Season ('winter', 'spring', 'summer', 'fall', 'annual')
 * @returns {Object} Minimum solution suggestion
 */
export function getMinSolutionSuggestion(deficitAh, currentSolarWatts, currentBatteryCount, region = 'desert_southwest', season = 'annual') {
  if (deficitAh <= 0) return null;
  
  const minBatteries = calculateMinBatteriesToSolveDeficit(deficitAh, currentBatteryCount);
  const minSolar = calculateMinSolarToSolveDeficit(deficitAh, currentSolarWatts, region, season);
  
  // Determine which is the minimum solution
  if (minBatteries === 0 && minSolar === 0) {
    return null; // Already solved
  }
  
  if (minBatteries === 0) {
    return { type: 'solar', value: minSolar, message: `Add ${minSolar}W solar to solve` };
  }
  
  if (minSolar === 0) {
    return { type: 'battery', value: minBatteries, message: `Add ${minBatteries} ${minBatteries === 1 ? 'battery' : 'batteries'} to solve` };
  }
  
  // Both are needed, return the one that requires less (simplified - could be more sophisticated)
  // For now, prefer battery if it's just 1, otherwise prefer solar
  if (minBatteries === 1) {
    return { type: 'battery', value: minBatteries, message: `Add ${minBatteries} battery to solve` };
  } else {
    return { type: 'solar', value: minSolar, message: `Add ${minSolar}W solar to solve` };
  }
}

/**
 * Calculate total battery bank capacity
 * @param {number} batteryCount - Number of batteries
 * @param {number} totalAhPerBattery - Total amp-hours per battery (460Ah for Epoch)
 * @returns {number} Total battery bank amp-hours
 */
export function calculateBatteryBankAh(batteryCount, totalAhPerBattery = batteryData.totalAh) {
  return batteryCount * totalAhPerBattery;
}

/**
 * Calculate total usable battery bank capacity
 * @param {number} batteryCount - Number of batteries
 * @param {number} usableAhPerBattery - Usable amp-hours per battery (414Ah for Epoch)
 * @returns {number} Total usable battery bank amp-hours
 */
export function calculateUsableBatteryBankAh(batteryCount, usableAhPerBattery = batteryData.usableAh) {
  return batteryCount * usableAhPerBattery;
}

/**
 * Calculate DC-DC alternator charging hours needed to charge battery to 100%
 * Uses the charger's amp rating per hour of travel.
 * @param {number} chargeAmountAh - Amount of energy to charge (Ah)
 * @param {number} chargerAmps - Orion XS charger amperage (30, 50, or 70) - this is amps per hour of travel
 * @param {number} loadDuringDrivingAmps - Optional: average load during driving (default 0, assumes minimal load while driving)
 * @returns {number} Hours of driving needed to charge the specified amount
 */
export function calculateDCChargingHours(chargeAmountAh, chargerAmps, loadDuringDrivingAmps = 0) {
  if (!chargerAmps || chargerAmps <= 0 || chargeAmountAh <= 0) return 0;
  
  // Net charging rate = charger output - load during driving
  // Most appliances are off or minimal during driving, so load is typically low
  const netChargingAmps = chargerAmps - loadDuringDrivingAmps;
  
  // If net charging is negative or zero, can't charge effectively
  if (netChargingAmps <= 0) {
    // Return hours based on gross charging rate (won't account for load)
    return chargeAmountAh / chargerAmps;
  }
  
  // Hours needed = charge amount / net charging rate (amps per hour of travel)
  // Example: Need 200 Ah, charger is 50A per hour = 4 hours of driving
  return chargeAmountAh / netChargingAmps;
}

/**
 * Calculate shore power charging hours needed to charge a given amount
 * @param {number} chargeAmountAh - Amount of energy to charge (can be battery capacity or energy deficit)
 * @param {string} shorePowerType - 'home15', 'home20', 'campground30', or 'campground50'
 * @param {number} dailyAmpHours - Total daily consumption (to calculate net charging rate)
 * @param {number} hoursPerDay - Hours per day (24 for continuous operation)
 * @returns {number} Hours needed to charge the specified amount
 */
export function calculateShorePowerHours(chargeAmountAh, shorePowerType, dailyAmpHours = 0, hoursPerDay = 24) {
  if (!shorePowerType || chargeAmountAh <= 0) return 0;
  
  // Shore power specifications (AC amperage and typical DC charging rate through Victron Multiplus 3k)
  const shorePowerSpecs = {
    'home15': {
      acAmps: 15,
      acVolts: 120,
      dcChargingAmps: 50, // Typical DC charging rate through inverter/charger
      label: '120V Home Plug (15A)'
    },
    'home20': {
      acAmps: 20,
      acVolts: 120,
      dcChargingAmps: 70, // Typical DC charging rate through inverter/charger
      label: '120V Home Plug (20A)'
    },
    'campground30': {
      acAmps: 30,
      acVolts: 120,
      dcChargingAmps: 100, // Typical DC charging rate through inverter/charger
      label: 'Campground 30A Shore Power'
    },
    'campground50': {
      acAmps: 50,
      acVolts: 120,
      dcChargingAmps: 120, // Typical DC charging rate through inverter/charger (max for Multiplus 3k)
      label: 'Campground 50A Shore Power'
    }
  };
  
  const spec = shorePowerSpecs[shorePowerType];
  if (!spec) return 0;
  
  // Calculate average load during charging
  const averageLoadAmps = dailyAmpHours / hoursPerDay;
  
  // Net charging rate = charger output - average load
  const netChargingAmps = spec.dcChargingAmps - averageLoadAmps;
  
  // If net charging is negative or zero, can't charge effectively
  if (netChargingAmps <= 0) {
    // Return hours based on gross charging rate (won't maintain 100%)
    return chargeAmountAh / spec.dcChargingAmps;
  }

  // Hours needed = charge amount / net charging rate
  return chargeAmountAh / netChargingAmps;
}

/**
 * Calculate generator hours needed to stay powered and maintain 100% battery
 * This accounts for the fact that the battery discharges during the day while
 * the generator is charging, so we need to calculate net charging rate.
 * @param {number} energyDeficitAh - Daily energy deficit after solar
 * @param {boolean} hasGenerator - Whether user has generator
 * @param {number} chargerAmps - Generator charger amperage (120A for Honda EU3200i)
 * @param {number} dailyAmpHours - Total daily consumption (to calculate average load during charging)
 * @param {number} hoursPerDay - Hours per day (24 for continuous operation)
 * @returns {number} Hours needed to run generator per day to maintain 100% battery
 */
export function calculateGeneratorHours(energyDeficitAh, hasGenerator, chargerAmps = 120, dailyAmpHours = 0, hoursPerDay = 24) {
  if (!hasGenerator || energyDeficitAh <= 0) return 0;
  
  // If no deficit, no generator needed
  if (energyDeficitAh <= 0) return 0;
  
  // Calculate average load during the day (Ah per hour)
  const averageLoadAmps = dailyAmpHours / hoursPerDay;
  
  // Net charging rate = charger output - average load
  // This accounts for the battery being discharged while charging
  const netChargingAmps = chargerAmps - averageLoadAmps;
  
  // If net charging is negative or zero, generator can't keep up
  if (netChargingAmps <= 0) {
    // Return hours needed just to replace deficit (won't maintain 100%)
    return energyDeficitAh / chargerAmps;
  }
  
  // Hours needed = energy deficit / net charging rate
  // This ensures battery stays at 100% by accounting for discharge during charging
  return energyDeficitAh / netChargingAmps;
}

/**
 * Main calculation function - performs all calculations
 * @param {Object} formData - Complete form data object
 * @returns {Object} Calculation results
 */
export function calculateBatteryRequirements(formData) {
  const {
    selectedAppliances,
    solarConfig = {},
    batteryConfig = {},
    chargingConfig = {}
  } = formData;

  // Fixed battery specs (Epoch 12V 460Ah)
  const systemVoltage = batteryData.batteryVoltage; // 12V
  const usableAhPerBattery = batteryData.usableAh; // 414Ah
  const totalAhPerBattery = batteryData.totalAh; // 460Ah
  const inverterEfficiency = batteryConfig.inverterEfficiency || 0.9; // Default 90%

  // Calculate running watts
  const runningWatts = calculateRunningWatts(selectedAppliances);

  // Calculate starting watts
  const startingWatts = calculateStartingWatts(selectedAppliances);

  // Calculate daily amp-hours consumption
  const dailyAmpHours = calculateDailyAmpHours(
    selectedAppliances,
    systemVoltage,
    inverterEfficiency
  );

  // Calculate solar contribution (based on selected solar watts)
  const solarWatts = solarConfig.solarWatts || 0;
  const region = solarConfig.region || 'desert_southwest';
  const season = solarConfig.season || 'annual';
  const solarAh = calculateSolarAh(
    solarWatts > 0,
    solarWatts,
    region,
    season
  );

  // Get selected battery count (user-selected, max 3)
  const batteryCount = Math.max(1, Math.min(3, batteryConfig.batteryCount || 1));

  // Calculate battery bank capacities based on selected count
  const batteryBankTotalAh = calculateBatteryBankAh(batteryCount, totalAhPerBattery);
  const batteryBankUsableAh = calculateUsableBatteryBankAh(batteryCount, usableAhPerBattery);

  // Calculate energy deficit after solar
  const energyDeficitAfterSolar = calculateEnergyDeficit(dailyAmpHours, solarAh);

  // Calculate final energy deficit after solar AND batteries
  const finalEnergyDeficitAh = calculateFinalEnergyDeficit(dailyAmpHours, solarAh, batteryBankUsableAh);

  // Calculate required solar wattage (if user doesn't have enough)
  const requiredSolarWatts = calculateRequiredSolarWatts(
    energyDeficitAfterSolar,
    region,
    season
  );

  // Calculate how much needs to be charged to get battery to 100%
  // If finalEnergyDeficitAh is positive or zero, battery is depleted, need full capacity
  // If finalEnergyDeficitAh is negative, battery has charge remaining
  // Interpretation: negative deficit means battery has that amount of charge left
  // To get to 100%, charge: batteryBankUsableAh - currentCharge
  let chargeAmountNeededTo100;
  if (finalEnergyDeficitAh >= 0) {
    // Deficit or zero: battery is depleted, need full capacity
    chargeAmountNeededTo100 = batteryBankUsableAh;
  } else {
    // Surplus (negative deficit): interpret as current charge level
    // If finalEnergyDeficitAh is -43.1, battery has 43.1 Ah left
    // To get to 100%: batteryBankUsableAh - 43.1
    const currentCharge = Math.abs(finalEnergyDeficitAh);
    chargeAmountNeededTo100 = Math.max(0, batteryBankUsableAh - currentCharge);
  }

  // Calculate generator hours needed per day to get battery to 100%
  const generatorHoursPerDay = calculateGeneratorHours(
    chargeAmountNeededTo100,
    chargingConfig.hasGenerator || false,
    120, // Honda EU3200i charger rate
    dailyAmpHours, // Pass daily consumption to calculate net charging rate
    24 // 24 hours per day
  );

  // Calculate drive time needed to get battery to 100%
  // DC-DC charger uses amps per hour of travel (not averaged over 24 hours)
  // Assume minimal load during driving (most appliances off while driving)
  const driveHoursToFull = calculateDCChargingHours(
    chargeAmountNeededTo100,
    chargingConfig.orionAmps || 0,
    0 // Minimal load during driving (can be adjusted if needed)
  );

  // Calculate shore power charging hours for different plug types to get battery to 100%
  const chargeAmountForShore = chargeAmountNeededTo100;
  const shorePowerHome15Hours = calculateShorePowerHours(
    chargeAmountForShore,
    'home15',
    dailyAmpHours,
    24
  );
  
  const shorePowerHome20Hours = calculateShorePowerHours(
    chargeAmountForShore,
    'home20',
    dailyAmpHours,
    24
  );
  
  const shorePowerCampground30Hours = calculateShorePowerHours(
    chargeAmountForShore,
    'campground30',
    dailyAmpHours,
    24
  );
  
  const shorePowerCampground50Hours = calculateShorePowerHours(
    chargeAmountForShore,
    'campground50',
    dailyAmpHours,
    24
  );

  return {
    runningWatts: Math.round(runningWatts),
    startingWatts: Math.round(startingWatts),
    dailyAmpHours: Math.round(dailyAmpHours * 10) / 10,
    solarAh: Math.round(solarAh * 10) / 10,
    energyDeficitAfterSolar: Math.round(energyDeficitAfterSolar * 10) / 10,
    finalEnergyDeficitAh: Math.round(finalEnergyDeficitAh * 10) / 10,
    batteryCount: batteryCount,
    batteryBankTotalAh: batteryBankTotalAh,
    batteryBankUsableAh: batteryBankUsableAh,
    requiredSolarWatts: requiredSolarWatts,
    generatorHoursPerDay: generatorHoursPerDay > 0 ? Math.round(generatorHoursPerDay * 10) / 10 : 0,
    driveHoursToFull: driveHoursToFull > 0 ? Math.round(driveHoursToFull * 10) / 10 : 0,
    shorePowerHome15Hours: shorePowerHome15Hours > 0 ? Math.round(shorePowerHome15Hours * 10) / 10 : 0,
    shorePowerHome20Hours: shorePowerHome20Hours > 0 ? Math.round(shorePowerHome20Hours * 10) / 10 : 0,
    shorePowerCampground30Hours: shorePowerCampground30Hours > 0 ? Math.round(shorePowerCampground30Hours * 10) / 10 : 0,
    shorePowerCampground50Hours: shorePowerCampground50Hours > 0 ? Math.round(shorePowerCampground50Hours * 10) / 10 : 0,
    chargeAmountNeededTo100: Math.round(chargeAmountNeededTo100 * 10) / 10,
    systemVoltage: systemVoltage,
    usableAhPerBattery: usableAhPerBattery,
    hasSolar: solarWatts > 0,
    solarWatts: solarWatts,
    hasGenerator: chargingConfig.hasGenerator || false,
    orionAmps: chargingConfig.orionAmps || 0
  };
}
