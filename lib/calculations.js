/**
 * Calculation engine for RV Power System Sizing
 * Updated for Epoch 12V 460Ah battery, solar, and charging sources
 */

import batteryData from '../data/battery.json';
import solarData from '../data/solar.json';

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
 * Calculate solar amp-hours contribution
 * @param {boolean} hasSolar - Whether user has solar
 * @param {number} solarWatts - Solar panel wattage
 * @param {string} sunCondition - 'sunny' or 'overcast'
 * @returns {number} Daily solar amp-hours
 */
export function calculateSolarAh(hasSolar, solarWatts = 0, sunCondition = 'sunny') {
  if (!hasSolar || !solarWatts) return 0;
  
  const sunHours = solarData.sunHours[sunCondition] || solarData.sunHours.sunny;
  const solarAh = (solarWatts * sunHours) / batteryData.batteryVoltage;
  
  return solarAh;
}

/**
 * Calculate energy deficit after solar contribution
 * @param {number} dailyAh - Daily amp-hour consumption
 * @param {number} solarAh - Solar amp-hour contribution
 * @returns {number} Energy deficit in amp-hours
 */
export function calculateEnergyDeficit(dailyAh, solarAh) {
  return Math.max(0, dailyAh - solarAh);
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
 * @param {string} sunCondition - 'sunny' or 'overcast'
 * @returns {number} Required solar wattage
 */
export function calculateRequiredSolarWatts(energyDeficitAh, sunCondition = 'sunny') {
  if (energyDeficitAh <= 0) return 0;
  
  const sunHours = solarData.sunHours[sunCondition] || solarData.sunHours.sunny;
  // solarAh = (watts × sunHours) / 12V
  // watts = (solarAh × 12V) / sunHours
  const requiredWatts = (energyDeficitAh * batteryData.batteryVoltage) / sunHours;
  
  return Math.ceil(requiredWatts / 10) * 10; // Round up to nearest 10W
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
 * Calculate DC-DC alternator charging hours to fully charge
 * @param {number} batteryBankUsableAh - Total usable battery bank capacity
 * @param {number} chargerAmps - Orion XS charger amperage (30, 50, or 70)
 * @returns {number} Hours needed to charge from empty to full
 */
export function calculateDCChargingHours(batteryBankUsableAh, chargerAmps) {
  if (!chargerAmps || chargerAmps <= 0) return 0;
  return batteryBankUsableAh / chargerAmps;
}

/**
 * Calculate generator hours needed to stay powered
 * @param {number} energyDeficitAh - Daily energy deficit after solar
 * @param {boolean} hasGenerator - Whether user has generator
 * @param {number} chargerAmps - Generator charger amperage (120A for Honda EU3200i)
 * @returns {number} Hours needed to run generator per day
 */
export function calculateGeneratorHours(energyDeficitAh, hasGenerator, chargerAmps = 120) {
  if (!hasGenerator || energyDeficitAh <= 0) return 0;
  // Generator needs to make up the daily deficit
  return energyDeficitAh / chargerAmps;
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
    chargingConfig = {}
  } = formData;

  // Fixed battery specs (Epoch 12V 460Ah)
  const systemVoltage = batteryData.batteryVoltage; // 12V
  const usableAhPerBattery = batteryData.usableAh; // 414Ah
  const totalAhPerBattery = batteryData.totalAh; // 460Ah
  const inverterEfficiency = 0.9; // Default 90%

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

  // Calculate solar contribution (if user has solar)
  const solarAh = calculateSolarAh(
    solarConfig.hasSolar || false,
    solarConfig.solarWatts || 0,
    solarConfig.sunCondition || 'sunny'
  );

  // Calculate energy deficit after solar
  const energyDeficitAh = calculateEnergyDeficit(dailyAmpHours, solarAh);

  // Calculate batteries needed (based on energy deficit)
  const batteriesNeeded = calculateBatteriesNeeded(energyDeficitAh, usableAhPerBattery);

  // Calculate battery bank capacities
  const batteryBankTotalAh = calculateBatteryBankAh(batteriesNeeded, totalAhPerBattery);
  const batteryBankUsableAh = calculateUsableBatteryBankAh(batteriesNeeded, usableAhPerBattery);

  // Calculate required solar wattage (if user doesn't have enough)
  const requiredSolarWatts = calculateRequiredSolarWatts(
    energyDeficitAh,
    solarConfig.sunCondition || 'sunny'
  );

  // Calculate generator hours needed per day to stay powered
  const generatorHoursPerDay = calculateGeneratorHours(
    energyDeficitAh,
    chargingConfig.hasGenerator || false,
    120 // Honda EU3200i charger rate
  );

  // Calculate drive time to charge from empty to 100%
  const driveHoursToFull = calculateDCChargingHours(
    batteryBankUsableAh,
    chargingConfig.orionAmps || 0
  );

  return {
    runningWatts: Math.round(runningWatts),
    startingWatts: Math.round(startingWatts),
    dailyAmpHours: Math.round(dailyAmpHours * 10) / 10,
    solarAh: Math.round(solarAh * 10) / 10,
    energyDeficitAh: Math.round(energyDeficitAh * 10) / 10,
    batteriesNeeded: batteriesNeeded,
    batteryBankTotalAh: batteryBankTotalAh,
    batteryBankUsableAh: batteryBankUsableAh,
    requiredSolarWatts: requiredSolarWatts,
    generatorHoursPerDay: generatorHoursPerDay > 0 ? Math.round(generatorHoursPerDay * 10) / 10 : 0,
    driveHoursToFull: driveHoursToFull > 0 ? Math.round(driveHoursToFull * 10) / 10 : 0,
    systemVoltage: systemVoltage,
    usableAhPerBattery: usableAhPerBattery,
    hasSolar: solarConfig.hasSolar || false,
    solarWatts: solarConfig.solarWatts || 0,
    hasGenerator: chargingConfig.hasGenerator || false,
    orionAmps: chargingConfig.orionAmps || 0
  };
}
