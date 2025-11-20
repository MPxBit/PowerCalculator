RV Battery Calculator
Below is a **structured spec outline** for your RV Battery Sizing Web App, based directly on the data you provided—but translated into a *usable product spec*, *required questions*, *calculations*, and *workflow*. This gives us everything we need to build the web app in the next step (UI spec, data model, code skeleton, etc.).

---

# ✅ **SPEC: RV Battery Amp-Hour Calculator Web Application**

## **1. App Purpose**

The web app helps RV owners calculate **how many battery amp-hours** they need to run a chosen set of appliances for a chosen number of hours, using their actual usage patterns and verifying running vs. starting watts.

The app must:

* Ask the user what appliances they want to run
* Estimate power draw (running + starting)
* Convert watts → amps → amp-hours
* Allow different battery system voltages (12V, 24V, 48V)
* Account for inverter efficiency
* Compute recommended battery bank size with reserve buffer

---

# ✅ **2. Key Questions the App Must Ask the User**

These questions are the core of the intake form. They map directly to calculations later.

---

## **2.1 Appliance Selection**

**"What kind of items would you like to power?"**

Use the list from your data:

| Appliance                 | Running Watts | Starting Watts |
| ------------------------- | ------------- | -------------- |
| One AC/Heater             | 1500          | 2000           |
| Two AC/Heaters            | 3000          | 2000           |
| Home Refrigerator/Freezer | 700           | 500            |
| Small Refrigerator        | 150           | 450            |
| Small Kitchen Appliances  | 400           | 450            |
| Microwave                 | 1000          | 0              |
| Electric Grill/Smoker     | 1650          | 0              |
| LED Lighting              | 50            | 0              |
| Television                | 150           | 0              |
| Laptop                    | 250           | 0              |
| Hair Dryer                | 1000          | 0              |
| Charging Devices          | 150           | 0              |

✔ App should allow **multiple selections**
✔ App should include **quantity where appropriate** (e.g., TVs, laptops).

---

## **2.2 Usage Duration and Patterns**

For each selected item:

**"How many hours per day will you use this?"**
**"Is this continuous or intermittent use?"**

Examples:

* AC might run 6 hours/day
* Microwave may run 0.2 hours/day
* Refrigerator runs 24h but cycles (33–50%)

App must include a cycle-rate slider for appliances that don't run continuously:

* Refrigerator duty cycle default: 40%
* AC duty cycle default: 50–70%

---

## **2.3 Battery System Details**

Ask:

* **"What is your battery bank voltage?"**

  * 12V
  * 24V
  * 48V

* **"What type of battery?"**

  * Lithium (usable ~90%)
  * AGM (usable ~50%)
  * Lead Acid (usable ~50–60%)

* **"What inverter efficiency should we assume?"**

  * Default 90%

* **"What reserve buffer do you want?"**

  * 10–30%

---

## **2.4 Environment & Notes**

Optional but helpful:

* **"Do you expect to run the microwave and air conditioner at the same time?"**
  (Important due to AC needing to already be running)

* **"Do you have long extension cords?"**
  (Adds slight extra load)

---

# ✅ **3. Data Model (App Internal)**

A simple JSON structure:

```json
{
  "appliances": [
    {
      "id": "ac_single",
      "label": "One Air Conditioner/Heater",
      "runningWatts": 1500,
      "startingWatts": 2000,
      "dutyCycle": 0.6
    }
  ],
  "battery": {
    "systemVoltage": 12,
    "batteryType": "lithium",
    "usableCapacityPct": 0.9,
    "inverterEfficiency": 0.9,
    "reservePct": 0.2
  },
  "usage": {
    "hoursPerDay": 6
  }
}
```

---

# ✅ **4. Calculations the App Must Perform**

---

## **4.1 Running Wattage Total**

Sum of all selected appliances, weighted by duty cycle:

```
running_watts_total = Σ (running watts × duty cycle)
```

---

## **4.2 Starting Wattage Requirement**

Determine the **maximum cumulative start load**:

```
starting_watts_total = max(starting watts of selected items)
```

Special case:
If microwave + AC selected → AC must be running first → microwave adds only running watts.

---

## **4.3 Convert Watts → Amps**

```
amps = watts / system_voltage
```

---

## **4.4 Convert Amps → Amp-Hours**

For each appliance:

```
amp_hours = (running watts × hours used) / (battery voltage × inverter efficiency)
```

Sum total Ah:

```
total_daily_Ah = Σ appliance_amp_hours
```

---

## **4.5 Apply Battery Type Usable Capacity**

Lithium vs AGM:

```
required_total_Ah = total_daily_Ah / usable_capacity_pct
```

---

## **4.6 Add Reserve Buffer**

```
recommended_Ah = required_total_Ah × (1 + reserve_pct)
```

---

# ✅ **5. App Workflow**

### **Step 1 — User selects appliances**

Multi-select checkbox list.
Quantity fields for some items.

### **Step 2 — Ask hours-per-day**

Dynamically generate input fields for selected items.

### **Step 3 — Ask battery preferences**

Voltage, battery type, reserve.

### **Step 4 — Perform calculations**

Running watts
Starting watts
Total Ah consumption
Minimum battery size
Recommended battery size

### **Step 5 — Output Display**

Show:

* Total Running Watts
* Total Starting Watts
* Total Daily Amp-Hours
* Battery Bank Required (usable vs. total)
* Recommended Battery Size with buffer
* Notes: microwave/AC conflict, inverter efficiency loss

---

# ✅ **6. Additional Features (Optional Enhancements)**

### ✓ Solar Input

“How many watts of solar do you have?”
“How many sun-hours per day?”

Add solar offset to battery calculation.

### ✓ Generator Integration

Since your data includes generator information, add:

* Minimum generator size (running watts + starting watts)
* Inverter vs. traditional generator recommendation

### ✓ Export to PDF

“Download your RV power plan.”

### ✓ Appliance preset editor

Allow user to enter custom wattages.

### ✓ Mobile-first layout

---

# ✅ **7. Ready-To-Build Deliverables**

I can now generate:

* **UI Wireframes**
* **Full Technical Spec**
* **JSON data schema**
* **Next.js or React app skeleton**
* **Express or Firebase backend**
* **Calculation engine in JS**
* **Downloadable ZIP folder**

Just tell me **which deliverables you want next.**

---

Would you like me to produce:

1. **A full functional spec document?**
2. **A Next.js code skeleton?**
3. **UI wireframes?**
4. **A calculation engine in JavaScript?**
5. **All of the above?**
