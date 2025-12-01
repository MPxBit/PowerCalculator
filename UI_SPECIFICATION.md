# UI Specification: RV Power System Calculator

## Document Purpose
This specification document provides a comprehensive overview of the current UI structure, components, and design patterns for the RV Power System Calculator application. This document serves as a reference for redesign efforts.

---

## 1. Application Overview

### 1.1 Purpose
The RV Power System Calculator is a web application that helps RV owners calculate their power system requirements, including:
- Battery capacity needs
- Solar panel requirements
- Charging time calculations
- Energy deficit/surplus analysis

### 1.2 Technology Stack
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: CSS (Global stylesheet)
- **State Management**: React hooks (useState, useEffect)
- **Persistence**: localStorage

### 1.3 Application Structure
- **Primary Page**: Single-page calculator (`app/page.jsx`)
- **Layout**: Two-column responsive layout
- **Navigation**: Single-page application (no routing in main flow)

---

## 2. Page Layout & Structure

### 2.1 Main Container
- **Class**: `single-page-container`
- **Max Width**: 1600px
- **Padding**: 20px
- **Background**: #f5f5f5
- **Layout**: Centered with auto margins

### 2.2 Page Header
- **Class**: `page-header`
- **Layout**: Flexbox (space-between)
- **Content**:
  - H1: "RV Power System Calculator"
  - Reset Button: "Reset Calculator" (secondary button style)
- **Border**: 2px solid #e0e0e0 (bottom)
- **Padding**: 30px 0
- **Margin**: 30px bottom

### 2.3 Two-Column Layout
- **Class**: `two-column-layout`
- **Grid**: 1fr 1fr (equal columns)
- **Gap**: 30px
- **Responsive**: Stacks to single column at ≤1200px

#### 2.3.1 Left Column
- **Class**: `left-column`
- **Content**:
  1. Power Requirements Card (conditional - only when results exist)
  2. Appliance Selector Component

#### 2.3.2 Right Column
- **Class**: `right-column`
- **Content** (conditional - only when results exist):
  1. Region Accordion & Season Selector
  2. Solar Panel Toggle Section
  3. Battery Toggle Section
  4. Impact Metrics Section
  5. Shore Power Charging Section
  6. Battery Bank Details Section
- **Empty State**: "Select appliances on the left to see power system recommendations."

---

## 3. Component Specifications

### 3.1 Power Requirements Card
**Location**: Left column, top
**Visibility**: Only shown when results exist

**Structure**:
- **Container**: `power-requirements-card`
- **Background**: White
- **Border**: 1px solid #e0e0e0
- **Border Radius**: 4px
- **Padding**: 20px
- **Margin**: 20px bottom

**Content**:
- **Title**: "Power Requirements" (h2, `section-title`)
- **Grid**: `power-requirements-grid` (3 columns, responsive to 1 column)
- **Items**: 3 metric cards
  - Running Watts: {value} W
  - Starting Watts: {value} W
  - Daily Consumption: {value} Ah

**Item Styling**:
- **Class**: `power-item`
- **Background**: #f9f9f9
- **Border Radius**: 4px
- **Padding**: 15px
- **Text Align**: Center
- **Label**: `power-label` (0.85rem, #666, 8px margin-bottom)
- **Value**: `power-value` (1.5rem, bold, #333)

---

### 3.2 Appliance Selector Component
**Location**: Left column, below Power Requirements
**File**: `components/ApplianceSelector.jsx`

**Structure**:
- **Container**: `appliance-selector`
- **Background**: White
- **Border**: 1px solid #e0e0e0
- **Padding**: 30px
- **Margin**: 30px bottom

**Header**:
- **Title**: "Select Appliances & Usage" (h2, `form-title`)
- **Subtitle**: "Select appliances and specify how long you'll use each per day" (p, `form-subtitle`)

**Sections**:
1. **Idle Draw Accordion** (collapsible)
2. **Appliance Categories** (grouped by category):
   - Climate Control
   - Cooking
   - Lighting
   - Electronics

**Category Structure**:
- **Container**: `appliance-category`
- **Header**: `category-header` (1.3rem, bold, #333, 15px margin-bottom, 2px border-bottom)
- **List**: `appliance-list` (flex column, 15px gap)

**Appliance Item**:
- **Container**: `appliance-item` (+ `selected` when active)
- **Border**: 2px solid #e0e0e0 (selected: #333)
- **Border Radius**: 4px
- **Padding**: 20px
- **Background**: White (selected: #fafafa)
- **Hover**: Border color changes to #999

**Checkbox Structure**:
- **Label**: `appliance-checkbox` (flex, align-start, 12px gap)
- **Checkbox**: 20px × 20px, accent-color #333
- **Text**: `appliance-label` (1.1rem, #333, font-weight 500)
- **Wattage Info**: `wattage-info` (0.9rem, #666, 4px margin-top)

**Usage Fields** (shown when selected):
- **Container**: `appliance-usage-fields` (15px margin-top, 32px margin-left, 15px padding-top, 1px border-top)
- **Fields**:
  - Quantity (if `hasQuantity`): Number input, min 1
  - Hours per day: Number input, min 0, max 24, step 0.1
  - Duty Cycle (if `needsDutyCycle`): Range slider, 0-1, step 0.01, with percentage display

**Input Styling**:
- **Class**: `quantity-field`, `hours-input`
- **Width**: 120px
- **Padding**: 8px
- **Border**: 1px solid #ddd
- **Border Radius**: 4px
- **Focus**: Border color #333

**Duty Cycle Slider**:
- **Class**: `duty-cycle-slider`
- **Width**: 100%
- **Margin**: 10px 0
- **Hint**: `duty-cycle-hint` (0.85rem, #666, italic)

---

### 3.3 Idle Draw Accordion
**File**: `components/IdleDrawAccordion.jsx`

**Structure**:
- **Container**: `idle-draw-accordion`
- **Border**: 1px solid #e0e0e0
- **Border Radius**: 4px
- **Background**: White
- **Margin**: 30px bottom

**Header**:
- **Button**: `accordion-header`
- **Background**: #f9f9f9
- **Border**: None (1px solid #e0e0e0 bottom)
- **Padding**: 20px
- **Display**: Flex (space-between)
- **Font**: 1.1rem, bold, #333
- **Hover**: Background #f0f0f0
- **Icon**: + / − (1.5rem, bold, #666)

**Content**:
- **Container**: `accordion-content`
- **Padding**: 20px
- **Description**: `accordion-description` (0.95rem, #666, italic, 20px margin-bottom)
- **Appliance List**: Same structure as main appliance list

---

### 3.4 Region Accordion
**File**: `components/RegionAccordion.jsx`

**Structure**:
- **Container**: `region-accordion`
- **Border**: 1px solid #e0e0e0
- **Border Radius**: 8px
- **Background**: White
- **Margin**: 20px bottom
- **Overflow**: Hidden

**Header**:
- Same styling as Idle Draw Accordion
- **Title**: Selected region label or "Select Your Region"

**Content**:
- Contains `RegionGrid` component when expanded

---

### 3.5 Region Grid
**File**: `components/RegionGrid.jsx`

**Structure**:
- **Container**: `region-grid-container`
- **Background**: White
- **Border**: 1px solid #e0e0e0
- **Border Radius**: 8px
- **Padding**: 20px

**Label**:
- **Class**: `region-grid-label`
- **Font**: 1.2rem, bold, #333
- **Text Align**: Center
- **Margin**: 20px bottom

**Slider**:
- **Container**: `region-slider-wrapper`
- **Slider**: `region-slider` (flex, horizontal scroll, 16px gap)
- **Max Width**: 624px (shows 4 cards)
- **Scrollbar**: Thin, custom styled

**Region Cards**:
- **Class**: `region-card-simple` (+ `selected`)
- **Width**: 140px (min-width)
- **Padding**: 20px 16px
- **Border**: 2px solid #e2e8f0 (selected: #0ea5e9)
- **Border Radius**: 16px
- **Background**: White (selected: #f0f9ff)
- **Box Shadow**: 0 1px 3px rgba(0,0,0,0.1)
- **Hover**: Transform translateY(-4px), shadow 0 10px 20px, border #7dd3fc
- **Selected**: Box shadow with blue glow

**Icon Wrapper**:
- **Class**: `region-icon-wrapper-simple`
- **Size**: 64px × 64px
- **Border Radius**: 12px
- **Background**: #f0f9ff
- **Margin**: 12px bottom
- **Icon**: 56px × 56px image

**Label**:
- **Class**: `region-label-simple`
- **Font**: 0.875rem, bold, #333
- **Text Align**: Center
- **Max Width**: 120px

---

### 3.6 Season Selector
**File**: `components/SeasonSelector.jsx`

**Structure**:
- **Container**: `season-selector-container`
- **Margin**: 20px bottom

**Header**:
- **Container**: `season-selector-header` (flex, space-between)
- **Button Group**: `season-button-group` (flex, horizontal scroll, 12px gap)
- **Solar Contribution Label**: `solar-contribution-label` (1rem, bold, #333, nowrap)

**Season Buttons**:
- **Class**: `season-button-image` (+ `selected`)
- **Size**: 98px × 98px (min-width)
- **Padding**: 14px 11px
- **Border**: 2px solid #e2e8f0 (selected: #10b981)
- **Border Radius**: 16px
- **Background**: White (selected: #f0fdf4)
- **Box Shadow**: 0 1px 3px rgba(0,0,0,0.1)
- **Hover**: Transform translateY(-4px), shadow 0 10px 20px, border #7dd3fc
- **Selected**: Box shadow with green glow

**Season Icon**:
- **Class**: `season-icon-image`
- **Size**: 70px × 70px
- **Hover Label**: `season-label-hover` (absolute, bottom 8px, 0.875rem, bold)

---

### 3.7 Solar Toggle Section
**Location**: Right column

**Structure**:
- **Container**: `solar-toggle-section`
- **Label**: `field-label` (bold, #333, margin-bottom 12px)
- **Text**: "Number of Solar Panels (220W increments):"

**Toggle Group**:
- **Container**: `toggle-button-group` (flex, wrap, 10px gap)
- **Buttons**: 6 options (220W, 440W, 660W, 880W, 1100W, 1320W)

**Toggle Button**:
- **Class**: `toggle-button` (+ `active`, `suggested`, `solves-deficit`)
- **Flex**: 1, min-width 100px
- **Padding**: 12px 20px
- **Border**: 2px solid #e0e0e0
- **Background**: White
- **Border Radius**: 4px
- **Font**: 0.95rem, medium, #666
- **Hover**: Border #333, background #f9f9f9
- **Active**: Background #333, color white, border #333
- **Suggested**: Border 2px dashed #28a745
- **Solves Deficit**: Border 2px solid #28a745, background rgba(40,167,69,0.1)
- **Tooltip**: On hover (data-tooltip attribute)

**Hint**:
- **Class**: `field-hint` (0.85rem, #666, 5px margin-top)
- **Text**: "Select one option. Each increment represents 220W (2 panels × 110W each)"

---

### 3.8 Battery Toggle Section
**Location**: Right column

**Structure**: Same as Solar Toggle Section
- **Label**: "Number of 460Ah Epoch Lithium Batteries:"
- **Buttons**: 1, 2, 3 batteries
- **Hint**: "Select the number of Epoch 12V 460Ah batteries (max 3)"

---

### 3.9 Impact Metrics Section
**Location**: Right column

**Structure**:
- **Container**: `impact-metrics-section`
- **Grid**: Auto-fit, minmax(200px, 1fr)
- **Gap**: 20px
- **Margin**: 20px bottom

**Impact Items**:
- **Class**: `impact-item` (+ `deficit`, `charge`, `highlight`, `clickable-question`)
- **Padding**: 20px
- **Border**: 1px solid #e0e0e0
- **Border Radius**: 4px
- **Text Align**: Center
- **Background**: #fafafa

**Variants**:
- **Deficit**: Background #dc3545, color white
- **Charge**: Background #28a745, color white
- **Highlight**: Background #333, color white
- **Clickable Question**: Border 2px dashed #999, background #f9f9f9, min-height 120px, flex center

**Content Structure**:
- **Label**: `impact-label` (0.9rem, #666, 10px margin-bottom, medium)
- **Value**: `impact-value` (2rem, bold, #333) or `large` (2.5rem)
- **Note**: `impact-note` (0.85rem, #666, 8px margin-top)
- **Note Small**: `impact-note-small` (0.75rem, #666, 4px margin-top, italic)

**Items**:
1. **Deficit/Charge**: Shows energy deficit (red) or charge (green) after solar & batteries
2. **Generator**: Clickable question or runtime display (if enabled)
3. **DC-DC Charger**: Clickable question or drive time display (if enabled)

---

### 3.10 Shore Power Section
**Location**: Right column

**Structure**:
- **Container**: `shore-power-section`
- **Background**: White
- **Border**: 1px solid #e0e0e0
- **Border Radius**: 4px
- **Padding**: 20px
- **Margin**: 20px bottom

**Title**:
- **Class**: `section-title` (1.3rem, bold, #333, 20px margin-bottom)
- **Text**: "Shore Power Charging"

**Charge Amount Info** (conditional):
- **Class**: `charge-amount-info`
- **Background**: #e8f5e9
- **Border**: 1px solid #4caf50
- **Border Radius**: 4px
- **Padding**: 12px
- **Margin**: 15px bottom
- **Text Align**: Center
- **Color**: #2e7d32
- **Font**: 0.95rem

**Grid**:
- **Container**: `shore-power-grid`
- **Grid**: Auto-fit, minmax(200px, 1fr)
- **Gap**: 15px
- **Margin**: 15px top

**Shore Power Items**:
- **Class**: `shore-power-item`
- **Padding**: 15px
- **Background**: #f9f9f9
- **Border**: 1px solid #e0e0e0
- **Border Radius**: 4px
- **Text Align**: Center

**Content**:
- **Label**: `shore-power-label` (0.9rem, #666, 8px margin-bottom, medium)
- **Value**: `shore-power-value` (1.8rem, bold, #333, 5px margin-bottom)
- **Note**: `shore-power-note` (0.8rem, #666, italic)

**Options** (conditional display):
- 120V Home Plug (15A)
- 120V Home Plug (20A)
- Campground 30A
- Campground 50A

**Hint**:
- **Class**: `shore-power-hint` (0.85rem, #666, 15px margin-top, italic, center)
- **Text**: "Charging times account for average load during charging. Times assume Victron Multiplus 3k inverter/charger."

---

### 3.11 Battery Details Section
**Location**: Right column

**Structure**:
- **Container**: `battery-details-section`
- **Background**: White
- **Border**: 1px solid #e0e0e0
- **Border Radius**: 4px
- **Padding**: 20px

**Title**:
- **Class**: `section-title`
- **Text**: "Battery Bank Details"

**Grid**:
- **Container**: `battery-details-grid`
- **Grid**: 2 columns, 20px gap
- **Margin**: 15px top

**Detail Items**:
- **Class**: `battery-detail-item`
- **Padding**: 15px
- **Background**: #f9f9f9
- **Border Radius**: 4px
- **Text Align**: Center

**Content**:
- **Label**: `battery-detail-label` (0.85rem, #666, 8px margin-bottom, medium)
- **Value**: `battery-detail-value` (1.5rem, bold, #333)
- **Note**: `battery-detail-note` (0.8rem, #666, 5px margin-top)

**Items**:
1. Total Capacity: {value} Ah
2. Usable Capacity: {value} Ah (with note: "90% usable ({value}Ah per battery)")

**Warning/Success Boxes** (conditional):
- **Warning**: `warning-box` (background #fff3cd, border #ffc107, color #856404)
- **Success**: `success-box` (background #d4edda, border #28a745, color #155724)
- **Padding**: 15px
- **Margin**: 20px top
- **Border Radius**: 4px

---

## 4. Design System

### 4.1 Color Palette

**Primary Colors**:
- **Dark Gray**: #333 (primary text, buttons, borders)
- **Medium Gray**: #666 (secondary text, labels)
- **Light Gray**: #999 (tertiary text, borders)
- **Very Light Gray**: #e0e0e0 (borders, dividers)
- **Background Gray**: #f5f5f5 (page background)
- **Card Background**: #f9f9f9 (card backgrounds, input backgrounds)
- **White**: #ffffff (card surfaces)

**Accent Colors**:
- **Blue**: #0ea5e9 (region selection, primary accents)
- **Green**: #28a745, #10b981 (success, charge, season selection)
- **Red**: #dc3545 (deficit, warnings)
- **Yellow**: #ffc107 (warnings)

**State Colors**:
- **Hover**: #555 (dark gray buttons)
- **Selected**: #333 (background), white (text)
- **Active**: #333 (background), white (text)

### 4.2 Typography

**Font Family**:
- System font stack: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif

**Font Sizes**:
- **H1**: 1.8rem (page header)
- **H2**: 1.5rem (form titles), 2rem (results titles)
- **H3**: 1.3rem (section titles, category headers)
- **Body**: 1rem (default)
- **Small**: 0.85rem - 0.95rem (hints, notes, labels)
- **Large Values**: 1.5rem - 2.5rem (metric displays)

**Font Weights**:
- **Normal**: 400
- **Medium**: 500
- **Semibold**: 600
- **Bold**: 700

**Line Height**: 1.6 (body), 1.3 (headings)

### 4.3 Spacing

**Padding**:
- **Small**: 8px - 12px
- **Medium**: 15px - 20px
- **Large**: 30px - 40px

**Margins**:
- **Small**: 5px - 8px
- **Medium**: 15px - 20px
- **Large**: 30px - 40px

**Gaps**:
- **Small**: 10px - 12px
- **Medium**: 15px - 20px
- **Large**: 30px

### 4.4 Border Radius

- **Small**: 4px (inputs, buttons, cards)
- **Medium**: 8px (accordions, containers)
- **Large**: 16px (region/season cards)
- **Full**: 50% (circular elements)

### 4.5 Shadows

- **Subtle**: 0 1px 3px rgba(0, 0, 0, 0.1)
- **Medium**: 0 2px 8px rgba(0, 0, 0, 0.2)
- **Large**: 0 10px 20px rgba(0, 0, 0, 0.15)
- **Glow**: 0 0 0 2px rgba(14, 165, 233, 0.2) (selected states)

### 4.6 Transitions

- **Duration**: 0.2s (standard)
- **Easing**: ease (standard), ease-in-out (some hover effects)
- **Properties**: background, border, transform, box-shadow

---

## 5. Interactive Elements

### 5.1 Buttons

**Primary Button**:
- **Class**: `button primary`
- **Background**: #333
- **Color**: White
- **Padding**: 12px 30px
- **Border Radius**: 4px
- **Font**: 1rem, semibold
- **Hover**: Background #555

**Secondary Button**:
- **Class**: `button secondary`
- **Background**: White
- **Color**: #333
- **Border**: 2px solid #333
- **Padding**: 12px 30px
- **Border Radius**: 4px
- **Font**: 1rem, semibold
- **Hover**: Background #f5f5f5

**Toggle Button**:
- See Section 3.7 for detailed specifications

### 5.2 Inputs

**Text/Number Inputs**:
- **Border**: 1px solid #ddd
- **Border Radius**: 4px
- **Padding**: 8px - 10px
- **Font**: 1rem
- **Focus**: Border color #333, outline none

**Range Slider**:
- **Width**: 100%
- **Margin**: 10px 0
- **Cursor**: pointer

**Checkbox**:
- **Size**: 20px × 20px
- **Accent Color**: #333
- **Cursor**: pointer

### 5.3 Accordions

**Behavior**:
- Click header to toggle
- Icon changes: + (closed) / − (open)
- Smooth expand/collapse (CSS transition)
- Content padding: 20px

### 5.4 Tooltips

**Implementation**: CSS-based using `data-tooltip` attribute
- **Position**: Absolute, above element
- **Background**: #333
- **Color**: White
- **Padding**: 8px - 14px
- **Border Radius**: 4px
- **Font**: 0.85rem - 0.9rem
- **Z-index**: 1000
- **Arrow**: CSS triangle (::before pseudo-element)

---

## 6. Responsive Design

### 6.1 Breakpoints

**Mobile**: ≤480px
- Single column layout
- Reduced font sizes
- Full-width buttons
- Stacked grids

**Tablet**: 481px - 1200px
- Two-column layout maintained
- Adjusted spacing
- Scrollable horizontal sections

**Desktop**: >1200px
- Full two-column layout
- Maximum content width: 1600px

### 6.2 Responsive Behaviors

**Two-Column Layout**:
- Desktop: 1fr 1fr
- Mobile/Tablet: 1fr (stacked)

**Grid Layouts**:
- Desktop: 3 columns (power requirements)
- Mobile: 1 column

**Horizontal Scrollers**:
- Region slider: Shows 4 cards on desktop, scrollable on mobile
- Season selector: Horizontal scroll on all sizes

**Font Scaling**:
- H1: 2.5rem → 1.5rem (mobile)
- H2: 2rem → 1.2rem (mobile)
- Result values: 2.5rem → 2rem (mobile)

---

## 7. State Management

### 7.1 Component State

**Main Page State** (`app/page.jsx`):
- `selectedAppliances`: Array of selected appliances
- `usageData`: Object with usage info per appliance
- `results`: Calculated results object (null when no selections)
- `solarWatts`: Number (220, 440, 660, 880, 1100, 1320, or 0)
- `batteryCount`: Number (1, 2, or 3)
- `region`: String (region key)
- `season`: String ('winter', 'spring', 'summer', 'fall')
- `hasGenerator`: Boolean
- `hasDCCharger`: Boolean

### 7.2 LocalStorage Keys

- `rvCalculator_selectedAppliances`
- `rvCalculator_usageData`
- `rvCalculator_solarConfig`
- `rvCalculator_batteryConfig`
- `rvCalculator_hasGenerator`
- `rvCalculator_hasDCCharger`

### 7.3 State Flow

1. User selects appliances → `selectedAppliances` updates → localStorage saves
2. User changes usage → `usageData` updates → localStorage saves
3. User changes solar/battery/region/season → respective state updates → localStorage saves
4. State changes trigger `useEffect` → calculations run → `results` updates
5. `results` change triggers UI updates (conditional rendering)

---

## 8. User Flows

### 8.1 Initial Load

1. Page loads
2. Check localStorage for saved data
3. If found, restore state
4. If not found, initialize with:
   - Idle draw appliances preselected
   - Default region: 'midatlantic'
   - Default season: 'fall'
   - Default solar: 220W
   - Default battery: 1
5. Calculate results if appliances selected
6. Render UI

### 8.2 Appliance Selection Flow

1. User expands Idle Draw accordion (optional)
2. User checks/unchecks appliances
3. When checked:
   - Appliance item shows selected state
   - Usage fields appear
   - Default values populate
4. User adjusts quantity, hours, duty cycle
5. Changes save to localStorage
6. Calculations run automatically
7. Results update in right column

### 8.3 Configuration Flow

1. User selects region (accordion → grid → card click)
2. User selects season (button click)
3. User toggles solar panels (button click)
4. User toggles batteries (button click)
5. User enables generator (click impact item)
6. User enables DC-DC charger (click impact item)
7. Each change triggers recalculation
8. Results update in real-time

### 8.4 Reset Flow

1. User clicks "Reset Calculator"
2. Confirmation dialog appears
3. If confirmed:
   - Clear all localStorage keys
   - Reset all state to defaults
   - Clear results
   - UI returns to initial state

---

## 9. Data Structures

### 9.1 Appliance Object

```javascript
{
  id: string,
  label: string,
  category: string,
  runningWatts: number,
  startingWatts: number,
  hoursPerDay?: number,
  needsDutyCycle?: boolean,
  defaultDutyCycle?: number,
  hasQuantity?: boolean
}
```

### 9.2 Selected Appliance

```javascript
{
  appliance: ApplianceObject,
  quantity: number
}
```

### 9.3 Usage Data

```javascript
{
  [applianceId]: {
    hoursPerDay: number,
    dutyCycle: number
  }
}
```

### 9.4 Results Object

```javascript
{
  runningWatts: number,
  startingWatts: number,
  dailyAmpHours: number,
  solarAh: number,
  batteryBankTotalAh: number,
  batteryBankUsableAh: number,
  usableAhPerBattery: number,
  finalEnergyDeficitAh: number,
  generatorHoursPerDay: number,
  driveHoursToFull: number,
  orionAmps: number,
  chargeAmountNeededTo100: number,
  shorePowerHome15Hours: number,
  shorePowerHome20Hours: number,
  shorePowerCampground30Hours: number,
  shorePowerCampground50Hours: number
}
```

### 9.5 Region Object

```javascript
{
  label: string,
  icon: string (path),
  psh: {
    winter: number,
    spring: number,
    summer: number,
    fall: number
  }
}
```

---

## 10. Accessibility Considerations

### 10.1 Current Implementation

- Semantic HTML (buttons, labels, headings)
- Keyboard navigation (buttons, inputs)
- Focus states (border color change)
- ARIA labels (implicit via semantic HTML)
- Alt text for images

### 10.2 Areas for Improvement

- Explicit ARIA labels for complex components
- ARIA expanded for accordions
- ARIA selected for toggle buttons
- Screen reader announcements for result changes
- Keyboard shortcuts documentation
- Focus trap in modals (if added)

---

## 11. Performance Considerations

### 11.1 Current Optimizations

- Conditional rendering (results only when available)
- localStorage for persistence (no server calls)
- CSS transitions (hardware accelerated)
- React hooks for state management

### 11.2 Potential Improvements

- Memoization of expensive calculations
- Virtual scrolling for long appliance lists
- Lazy loading of images
- Code splitting for routes (if multi-page added)

---

## 12. Browser Support

### 12.1 Target Browsers

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### 12.2 CSS Features Used

- CSS Grid
- Flexbox
- CSS Custom Properties (limited)
- CSS Transitions
- CSS Pseudo-elements (tooltips)

---

## 13. File Structure Reference

```
app/
  page.jsx              # Main calculator page
  layout.jsx            # Root layout
components/
  ApplianceSelector.jsx # Appliance selection component
  RegionAccordion.jsx   # Region selection accordion
  RegionGrid.jsx        # Region grid component
  SeasonSelector.jsx    # Season selection component
  IdleDrawAccordion.jsx # Idle draw accordion
  [Other components...]
styles/
  globals.css           # Global stylesheet
data/
  appliances.json       # Appliance data
  regions.json          # Region data
  battery.json          # Battery specifications
  solar.json            # Solar specifications
lib/
  calculations.js       # Calculation logic
  debug.js              # Debug utilities
```

---

## 14. Design Patterns

### 14.1 Component Patterns

- **Container/Presentational**: Main page is container, components are presentational
- **Controlled Components**: All inputs are controlled via React state
- **Lifting State Up**: State managed at page level, passed down as props
- **Composition**: Components composed together (accordion contains grid)

### 14.2 Styling Patterns

- **BEM-like Naming**: Component-based class names
- **Utility Classes**: Limited (mostly component-specific)
- **CSS Variables**: Not used (could be added)
- **Mobile-First**: Not implemented (desktop-first approach)

### 14.3 State Patterns

- **Single Source of Truth**: Page-level state
- **Derived State**: Results calculated from inputs
- **Persistence**: localStorage for all user data
- **Optimistic Updates**: Immediate UI updates, localStorage sync

---

## 15. Known Issues & Limitations

### 15.1 Current Limitations

- No error handling UI (calculations may fail silently)
- No loading states
- No validation feedback for inputs
- Limited mobile optimization
- No print styles
- No dark mode
- No internationalization

### 15.2 Technical Debt

- Large global CSS file (could be modularized)
- Inline styles used in some places
- No TypeScript (JavaScript only)
- No component library (custom components)
- Limited testing infrastructure

---

## 16. Redesign Recommendations

### 16.1 Visual Improvements

- Modern color palette with better contrast
- Consistent spacing system (design tokens)
- Improved typography hierarchy
- Better visual feedback for interactions
- Enhanced empty states
- Loading skeletons

### 16.2 UX Improvements

- Progressive disclosure (wizard flow option)
- Better mobile experience
- Input validation with clear feedback
- Undo/redo functionality
- Export results functionality
- Comparison mode (multiple scenarios)

### 16.3 Technical Improvements

- Component library (design system)
- TypeScript migration
- State management library (if complexity grows)
- Testing framework
- Performance monitoring
- Analytics integration

---

## Appendix A: CSS Class Reference

### Layout Classes
- `.single-page-container`
- `.two-column-layout`
- `.left-column`
- `.right-column`
- `.page-header`

### Card Classes
- `.power-requirements-card`
- `.appliance-selector`
- `.impact-item`
- `.shore-power-section`
- `.battery-details-section`

### Component Classes
- `.region-accordion`
- `.region-grid-container`
- `.season-selector-container`
- `.toggle-button-group`
- `.impact-metrics-section`

### Utility Classes
- `.section-title`
- `.field-label`
- `.field-hint`
- `.button`
- `.button.primary`
- `.button.secondary`

---

## Appendix B: Component Props Reference

### ApplianceSelector
- `selectedAppliances`: Array
- `usageData`: Object
- `onSelectionChange`: Function
- `onUsageChange`: Function

### RegionAccordion
- `selectedKey`: String
- `onSelect`: Function

### RegionGrid
- `selectedKey`: String
- `onSelect`: Function

### SeasonSelector
- `regionKey`: String
- `selectedSeason`: String
- `onSelect`: Function
- `solarContribution`: Number (optional)

---

**Document Version**: 1.0
**Last Updated**: 2024
**Maintained By**: Development Team

