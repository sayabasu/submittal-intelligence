#!/usr/bin/env bash
#
# generate-sample-data.sh — Generate a sample CSV file for uploading via the UI
#
# Usage:
#   ./generate-sample-data.sh                  # Default: 50 rows → sample-upload.csv
#   ./generate-sample-data.sh 100              # Custom row count
#   ./generate-sample-data.sh 25 my-data.csv   # Custom rows + filename
#

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"

ROW_COUNT="${1:-50}"
OUTPUT_FILE="${2:-sample-upload.csv}"

GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo ""
echo -e "${CYAN}${BOLD}Generating sample submittal data...${NC}"
echo -e "   Rows:   ${BOLD}$ROW_COUNT${NC}"
echo -e "   Output: ${BOLD}$OUTPUT_FILE${NC}"
echo ""

node -e "
const fs = require('fs');

const ROW_COUNT = parseInt('${ROW_COUNT}', 10);
const OUTPUT_FILE = '${OUTPUT_FILE}';

// ── Equipment catalog ──────────────────────────────────────

const catalog = [
  // Electrical
  { discipline: 'Electrical', category: 'MV Transformer',          spec: '26 11 16', leadMin: 40, leadMax: 72, desc: ['Medium Voltage Transformer 15/25MVA', 'Pad-Mount Transformer 7.5MVA', 'Dry-Type Transformer 2MVA', 'Medium Voltage Transformer 10/15MVA'] },
  { discipline: 'Electrical', category: '15kV Switchgear',         spec: '26 13 13', leadMin: 30, leadMax: 52, desc: ['15kV Metal-Clad Switchgear', '15kV Vacuum Circuit Breaker', 'Medium Voltage Switchgear Assembly'] },
  { discipline: 'Electrical', category: 'UPS System',              spec: '26 33 53', leadMin: 16, leadMax: 36, desc: ['Rotary UPS 1500kVA', 'Static UPS 750kVA', 'Modular UPS 500kVA', 'UPS Battery Cabinet'] },
  { discipline: 'Electrical', category: 'Generator',               spec: '26 32 13', leadMin: 20, leadMax: 40, desc: ['Diesel Generator 2500kW', 'Diesel Generator 2000kW', 'Generator Paralleling Switchgear'] },
  { discipline: 'Electrical', category: 'PDU',                     spec: '26 24 16', leadMin: 12, leadMax: 24, desc: ['Power Distribution Unit 225kVA', 'Remote Power Panel 100A', 'Static Transfer Switch 400A'] },
  { discipline: 'Electrical', category: 'Busway',                  spec: '26 25 13', leadMin: 10, leadMax: 20, desc: ['Busway 4000A', 'Busway 3000A', 'Busway Tap-Off Box'] },
  { discipline: 'Electrical', category: 'Cable Tray',              spec: '26 05 33', leadMin: 4,  leadMax: 12, desc: ['Cable Tray Ladder Type 24\"', 'Cable Tray Wireway 12\"', 'Cable Tray Fittings Package'] },

  // Mechanical
  { discipline: 'Mechanical', category: 'Chiller',                 spec: '23 64 16', leadMin: 20, leadMax: 44, desc: ['Centrifugal Chiller 1500 Ton', 'Screw Chiller 500 Ton', 'Air-Cooled Chiller 300 Ton'] },
  { discipline: 'Mechanical', category: 'CRAH Unit',               spec: '23 81 26', leadMin: 14, leadMax: 28, desc: ['Computer Room Air Handler 100kW', 'In-Row Cooling Unit 40kW', 'Rear-Door Heat Exchanger 30kW'] },
  { discipline: 'Mechanical', category: 'Cooling Tower',           spec: '23 65 13', leadMin: 16, leadMax: 32, desc: ['Induced Draft Cooling Tower 600 Ton', 'Crossflow Cooling Tower 400 Ton'] },
  { discipline: 'Mechanical', category: 'Pump',                    spec: '23 21 13', leadMin: 8,  leadMax: 20, desc: ['Chilled Water Pump 100HP', 'Condenser Water Pump 75HP', 'Glycol Pump 25HP'] },
  { discipline: 'Mechanical', category: 'Piping',                  spec: '23 11 13', leadMin: 6,  leadMax: 16, desc: ['Chilled Water Piping 12\"', 'Condenser Water Piping 10\"', 'Piping Insulation Package'] },

  // Fire Protection
  { discipline: 'Fire Protection', category: 'Fire Suppression',   spec: '21 13 13', leadMin: 10, leadMax: 24, desc: ['Clean Agent Suppression System FM-200', 'Pre-Action Sprinkler System', 'VESDA Smoke Detection System'] },
  { discipline: 'Fire Protection', category: 'Fire Alarm',         spec: '28 31 11', leadMin: 8,  leadMax: 16, desc: ['Fire Alarm Control Panel', 'Smoke Detector Assembly', 'Fire Alarm Notification Devices'] },
  { discipline: 'Fire Protection', category: 'Fire Pump',          spec: '21 11 13', leadMin: 12, leadMax: 20, desc: ['Fire Pump 750 GPM', 'Jockey Pump Assembly'] },

  // Structural
  { discipline: 'Structural', category: 'Steel',                   spec: '05 12 00', leadMin: 8,  leadMax: 20, desc: ['Structural Steel W-Shape Package', 'Steel Beam Assembly W36x194', 'Steel Column Package'] },
  { discipline: 'Structural', category: 'Concrete',                spec: '03 30 00', leadMin: 4,  leadMax: 12, desc: ['Concrete Sealer', 'Lightweight Concrete Topping', 'Precast Concrete Panel'] },
  { discipline: 'Structural', category: 'Raised Floor',            spec: '09 69 13', leadMin: 10, leadMax: 18, desc: ['Raised Access Floor 24\"x24\"', 'Raised Floor Pedestal Assembly', 'Raised Floor Stringer System'] },

  // BMS / Controls
  { discipline: 'BMS/Controls', category: 'BMS Controller',        spec: '25 00 00', leadMin: 4,  leadMax: 12, desc: ['BMS Main Controller DDC', 'BMS Field Controller', 'BMS Graphics Workstation'] },
  { discipline: 'BMS/Controls', category: 'Building Automation',   spec: '25 10 00', leadMin: 6,  leadMax: 14, desc: ['Building Automation Server', 'BMS Network Controller', 'DCIM Software Platform'] },
  { discipline: 'BMS/Controls', category: 'Metering',              spec: '26 27 26', leadMin: 6,  leadMax: 14, desc: ['Power Monitoring System PM8000', 'Branch Circuit Monitor', 'Power Quality Meter ION9000'] },
];

// ── Vendors ────────────────────────────────────────────────

const vendors = {
  'Electrical':       ['ABB Ltd', 'Schneider Electric', 'Siemens Building', 'Eaton Corporation', 'Vertiv Group', 'Caterpillar Inc', 'Cummins Power', 'Johnson Controls'],
  'Mechanical':       ['Trane Technologies', 'Carrier Global', 'Johnson Controls', 'Daikin Applied', 'BAC Cooling', 'Grundfos Pumps', 'Armstrong Fluid'],
  'Fire Protection':  ['Kidde Fire Systems', 'Tyco Fire Products', 'Victaulic Company', 'Honeywell Fire'],
  'Structural':       ['Nucor Corporation', 'Steel Fabricators Inc', 'Tate Access Floors', 'Kingspan Group'],
  'BMS/Controls':     ['Johnson Controls', 'Schneider Electric', 'Siemens Building', 'Eaton Corporation', 'Vertiv Group'],
};

const reviewers = [
  { name: 'James Chen',      email: 'james.chen@hyperion.com',     title: 'MEP Lead' },
  { name: 'Sarah Okonkwo',   email: 'sarah.okonkwo@hyperion.com',  title: 'Electrical Engineer' },
  { name: 'David Park',      email: 'david.park@hyperion.com',     title: 'Structural Lead' },
  { name: 'Maria Santos',    email: 'maria.santos@hyperion.com',   title: 'Fire Protection Eng' },
  { name: 'Kevin Walsh',     email: 'kevin.walsh@hyperion.com',    title: 'Mechanical Engineer' },
  { name: 'Lisa Huang',      email: 'lisa.huang@hyperion.com',     title: 'Controls Engineer' },
];

const statuses = ['Not Submitted', 'Submitted', 'Under Review', 'Approved', 'Approved as Noted', 'Rejected', 'Revise and Resubmit'];
const statusWeights = [0.08, 0.15, 0.25, 0.35, 0.08, 0.04, 0.05]; // realistic distribution

// ── Helpers ────────────────────────────────────────────────

let seed = 42;
function rng() {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
}

function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }
function randInt(min, max) { return Math.floor(rng() * (max - min + 1)) + min; }

function weightedPick(items, weights) {
  const r = rng();
  let sum = 0;
  for (let i = 0; i < items.length; i++) {
    sum += weights[i];
    if (r <= sum) return items[i];
  }
  return items[items.length - 1];
}

function addDays(dateStr, days) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

function fmtDate(dateStr) {
  // Output as MM/DD/YYYY for spreadsheet friendliness
  const [y, m, d] = dateStr.split('-');
  return m + '/' + d + '/' + y;
}

// ── CSV escaping ───────────────────────────────────────────

function csvEscape(val) {
  if (val === null || val === undefined || val === '') return '';
  const s = String(val);
  if (s.includes(',') || s.includes('\"') || s.includes('\\n')) {
    return '\"' + s.replace(/\"/g, '\"\"') + '\"';
  }
  return s;
}

// ── Generate rows ──────────────────────────────────────────

const today = new Date().toISOString().split('T')[0];
const projectStart = '2026-01-15';
const rows = [];

// Counters per discipline for submittal numbering
const counters = {};

for (let i = 0; i < ROW_COUNT; i++) {
  const entry = pick(catalog);
  const disc = entry.discipline;
  const prefix = disc === 'Electrical' ? 'E' :
                 disc === 'Mechanical' ? 'M' :
                 disc === 'Fire Protection' ? 'FP' :
                 disc === 'Structural' ? 'S' :
                 'BC';

  counters[prefix] = (counters[prefix] || 0) + 1;
  const num = String(counters[prefix]).padStart(3, '0');
  const submittalNumber = prefix + '-' + num;

  const unitNum = randInt(1, 10);
  const description = pick(entry.desc) + ' - Unit ' + unitNum;

  const vendor = pick(vendors[disc] || vendors['Electrical']);
  const reviewer = pick(reviewers);
  const leadWeeks = randInt(entry.leadMin, entry.leadMax);
  const shippingDays = randInt(7, 21);
  const poDays = randInt(7, 14);

  // Required on-site date: 6-18 months from project start
  const siteOffset = randInt(180, 540);
  const requiredOnSite = addDays(projectStart, siteOffset);

  // Submitted date: some in the past, some not yet
  const status = weightedPick(statuses, statusWeights);
  let submittedDate = '';
  let reviewDueDate = '';
  let approvedDate = '';

  if (status !== 'Not Submitted') {
    const submitOffset = randInt(-60, 30); // relative to today
    submittedDate = addDays(today, submitOffset);
    reviewDueDate = addDays(submittedDate, randInt(14, 28));

    if (status === 'Approved' || status === 'Approved as Noted') {
      approvedDate = addDays(submittedDate, randInt(7, 21));
    }
  }

  rows.push({
    'Submittal No': submittalNumber,
    'Spec Section': entry.spec,
    'Description': description,
    'Discipline': disc,
    'Equipment Category': entry.category,
    'Status': status,
    'Vendor': vendor,
    'Reviewer': reviewer.name,
    'Submitted Date': submittedDate ? fmtDate(submittedDate) : '',
    'Review Due Date': reviewDueDate ? fmtDate(reviewDueDate) : '',
    'Approved Date': approvedDate ? fmtDate(approvedDate) : '',
    'Required On Site': fmtDate(requiredOnSite),
    'Lead Time (Weeks)': leadWeeks,
    'Shipping Buffer (Days)': shippingDays,
    'PO Processing (Days)': poDays,
  });
}

// ── Write CSV ──────────────────────────────────────────────

const headers = Object.keys(rows[0]);
const lines = [
  headers.map(csvEscape).join(','),
  ...rows.map(r => headers.map(h => csvEscape(r[h])).join(','))
];

fs.writeFileSync(OUTPUT_FILE, lines.join('\\n'), 'utf8');

// Stats
const byDisc = {};
const byStatus = {};
rows.forEach(r => {
  byDisc[r['Discipline']] = (byDisc[r['Discipline']] || 0) + 1;
  byStatus[r['Status']] = (byStatus[r['Status']] || 0) + 1;
});

console.log('');
console.log('Distribution by Discipline:');
Object.entries(byDisc).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k.padEnd(20) + v));
console.log('');
console.log('Distribution by Status:');
Object.entries(byStatus).sort((a,b) => b[1]-a[1]).forEach(([k,v]) => console.log('  ' + k.padEnd(25) + v));
console.log('');
"

echo -e "${GREEN}${BOLD}✓  Generated ${OUTPUT_FILE}${NC}"
echo -e "   Upload it at: ${BOLD}http://localhost:3000/upload${NC}"
echo ""
