import { PrismaClient } from "@prisma/client";
import seedrandom from "seedrandom";

const prisma = new PrismaClient();
const rng = seedrandom("terabase-dc01-2026");

function rand(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return min + rng() * (max - min);
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// Reference date: today
const TODAY = new Date("2026-03-14");
const NTP_DATE = new Date("2025-09-15"); // 6 months ago
const TARGET_COMPLETION = new Date("2027-03-15"); // 18 months from NTP

// Reviewers
const REVIEWERS = [
  { name: "James Chen", role: "MEP Lead", email: "j.chen@meridiangroup.com" },
  { name: "Sarah Okonkwo", role: "Electrical Engineer", email: "s.okonkwo@meridiangroup.com" },
  { name: "Marcus Rivera", role: "Mechanical PM", email: "m.rivera@meridiangroup.com" },
  { name: "Lisa Thompson", role: "Fire Protection Engineer", email: "l.thompson@meridiangroup.com" },
  { name: "David Park", role: "Structural Engineer", email: "d.park@meridiangroup.com" },
  { name: "Rachel Adams", role: "Controls Specialist", email: "r.adams@meridiangroup.com" },
];

// Lead time reference data
const LEAD_TIME_REFS = [
  { equipmentCategory: "mv_transformer", displayName: "Medium Voltage Transformer", typicalLeadTimeWeeks: 65, minLeadTimeWeeks: 52, maxLeadTimeWeeks: 80, typicalReviewDays: 21 },
  { equipmentCategory: "lv_transformer", displayName: "Low Voltage Transformer", typicalLeadTimeWeeks: 24, minLeadTimeWeeks: 16, maxLeadTimeWeeks: 32, typicalReviewDays: 14 },
  { equipmentCategory: "switchgear_15kv", displayName: "15kV Switchgear", typicalLeadTimeWeeks: 52, minLeadTimeWeeks: 40, maxLeadTimeWeeks: 65, typicalReviewDays: 21 },
  { equipmentCategory: "switchgear_5kv", displayName: "5kV Switchgear", typicalLeadTimeWeeks: 40, minLeadTimeWeeks: 30, maxLeadTimeWeeks: 52, typicalReviewDays: 18 },
  { equipmentCategory: "ups_system", displayName: "UPS System", typicalLeadTimeWeeks: 28, minLeadTimeWeeks: 20, maxLeadTimeWeeks: 36, typicalReviewDays: 14 },
  { equipmentCategory: "generator", displayName: "Diesel Generator", typicalLeadTimeWeeks: 36, minLeadTimeWeeks: 28, maxLeadTimeWeeks: 48, typicalReviewDays: 18 },
  { equipmentCategory: "pdu", displayName: "Power Distribution Unit", typicalLeadTimeWeeks: 16, minLeadTimeWeeks: 12, maxLeadTimeWeeks: 24, typicalReviewDays: 10 },
  { equipmentCategory: "busway", displayName: "Busway System", typicalLeadTimeWeeks: 20, minLeadTimeWeeks: 14, maxLeadTimeWeeks: 28, typicalReviewDays: 12 },
  { equipmentCategory: "ats", displayName: "Automatic Transfer Switch", typicalLeadTimeWeeks: 18, minLeadTimeWeeks: 12, maxLeadTimeWeeks: 24, typicalReviewDays: 10 },
  { equipmentCategory: "cable_tray", displayName: "Cable Tray System", typicalLeadTimeWeeks: 10, minLeadTimeWeeks: 6, maxLeadTimeWeeks: 14, typicalReviewDays: 7 },
  { equipmentCategory: "chiller", displayName: "Chiller", typicalLeadTimeWeeks: 36, minLeadTimeWeeks: 28, maxLeadTimeWeeks: 52, typicalReviewDays: 18 },
  { equipmentCategory: "crah", displayName: "CRAH Unit", typicalLeadTimeWeeks: 24, minLeadTimeWeeks: 16, maxLeadTimeWeeks: 32, typicalReviewDays: 14 },
  { equipmentCategory: "cooling_tower", displayName: "Cooling Tower", typicalLeadTimeWeeks: 28, minLeadTimeWeeks: 20, maxLeadTimeWeeks: 36, typicalReviewDays: 14 },
  { equipmentCategory: "pump", displayName: "Pump (Chilled/Condenser Water)", typicalLeadTimeWeeks: 16, minLeadTimeWeeks: 10, maxLeadTimeWeeks: 24, typicalReviewDays: 10 },
  { equipmentCategory: "piping", displayName: "Piping System", typicalLeadTimeWeeks: 12, minLeadTimeWeeks: 8, maxLeadTimeWeeks: 16, typicalReviewDays: 10 },
  { equipmentCategory: "air_handler", displayName: "Air Handling Unit", typicalLeadTimeWeeks: 20, minLeadTimeWeeks: 14, maxLeadTimeWeeks: 28, typicalReviewDays: 12 },
  { equipmentCategory: "fm200_suppression", displayName: "FM-200/Novec Suppression System", typicalLeadTimeWeeks: 16, minLeadTimeWeeks: 12, maxLeadTimeWeeks: 20, typicalReviewDays: 14 },
  { equipmentCategory: "fire_alarm", displayName: "Fire Alarm Panel", typicalLeadTimeWeeks: 12, minLeadTimeWeeks: 8, maxLeadTimeWeeks: 16, typicalReviewDays: 10 },
  { equipmentCategory: "sprinkler", displayName: "Sprinkler System", typicalLeadTimeWeeks: 10, minLeadTimeWeeks: 6, maxLeadTimeWeeks: 14, typicalReviewDays: 10 },
  { equipmentCategory: "smoke_detection", displayName: "VESDA Smoke Detection", typicalLeadTimeWeeks: 14, minLeadTimeWeeks: 10, maxLeadTimeWeeks: 18, typicalReviewDays: 10 },
  { equipmentCategory: "structural_steel", displayName: "Structural Steel", typicalLeadTimeWeeks: 14, minLeadTimeWeeks: 10, maxLeadTimeWeeks: 20, typicalReviewDays: 14 },
  { equipmentCategory: "raised_floor", displayName: "Raised Floor System", typicalLeadTimeWeeks: 12, minLeadTimeWeeks: 8, maxLeadTimeWeeks: 16, typicalReviewDays: 10 },
  { equipmentCategory: "concrete", displayName: "Concrete Mix Design", typicalLeadTimeWeeks: 4, minLeadTimeWeeks: 2, maxLeadTimeWeeks: 6, typicalReviewDays: 7 },
  { equipmentCategory: "bms_controller", displayName: "BMS Controller", typicalLeadTimeWeeks: 12, minLeadTimeWeeks: 8, maxLeadTimeWeeks: 16, typicalReviewDays: 10 },
  { equipmentCategory: "power_monitoring", displayName: "Power Monitoring System", typicalLeadTimeWeeks: 10, minLeadTimeWeeks: 6, maxLeadTimeWeeks: 14, typicalReviewDays: 10 },
  { equipmentCategory: "dcim", displayName: "DCIM Software", typicalLeadTimeWeeks: 8, minLeadTimeWeeks: 4, maxLeadTimeWeeks: 12, typicalReviewDays: 14 },
  { equipmentCategory: "sensors", displayName: "Environmental Sensors", typicalLeadTimeWeeks: 6, minLeadTimeWeeks: 4, maxLeadTimeWeeks: 10, typicalReviewDays: 7 },
];

// Equipment templates for submittal generation
interface EquipmentTemplate {
  discipline: string;
  equipmentCategory: string;
  specSection: string;
  descriptions: string[];
  vendors: string[];
  count: number;
}

const EQUIPMENT_TEMPLATES: EquipmentTemplate[] = [
  // Electrical - ~120 items
  { discipline: "Electrical", equipmentCategory: "mv_transformer", specSection: "26 12 00", descriptions: ["Medium Voltage Transformer 15/25MVA", "Medium Voltage Transformer 10/15MVA", "MV Pad-Mount Transformer 7.5MVA", "Medium Voltage Step-Down Transformer 20MVA"], vendors: ["Siemens Energy", "ABB Ltd", "Schneider Electric"], count: 8 },
  { discipline: "Electrical", equipmentCategory: "lv_transformer", specSection: "26 22 00", descriptions: ["Low Voltage Dry-Type Transformer 1000kVA", "LV Transformer 750kVA", "Low Voltage Transformer 500kVA", "K-Rated Transformer 300kVA"], vendors: ["Eaton Corporation", "Schneider Electric", "ABB Ltd"], count: 12 },
  { discipline: "Electrical", equipmentCategory: "switchgear_15kv", specSection: "26 13 00", descriptions: ["15kV Metal-Clad Switchgear", "15kV Vacuum Circuit Breaker Assembly", "Medium Voltage Switchgear Section", "15kV SF6 Switchgear Module"], vendors: ["Siemens Energy", "Eaton Corporation", "Schneider Electric"], count: 8 },
  { discipline: "Electrical", equipmentCategory: "switchgear_5kv", specSection: "26 13 16", descriptions: ["5kV Metal-Enclosed Switchgear", "5kV Motor Control Center", "5kV Distribution Switchgear"], vendors: ["Eaton Corporation", "Schneider Electric", "ABB Ltd"], count: 10 },
  { discipline: "Electrical", equipmentCategory: "ups_system", specSection: "26 33 00", descriptions: ["Rotary UPS 1200kVA", "Static UPS 750kVA N+1", "Modular UPS System 500kVA", "Flywheel UPS 900kVA"], vendors: ["Vertiv Group", "Schneider Electric", "Eaton Corporation"], count: 12 },
  { discipline: "Electrical", equipmentCategory: "generator", specSection: "26 32 13", descriptions: ["Diesel Generator 2500kW", "Emergency Generator 2000kW", "Standby Generator 3000kW", "Diesel Generator Set 1500kW"], vendors: ["Caterpillar Power", "Cummins Power", "MTU Onsite Energy"], count: 10 },
  { discipline: "Electrical", equipmentCategory: "pdu", specSection: "26 24 16", descriptions: ["Power Distribution Unit 400A", "Remote Power Panel 225A", "Floor-Mount PDU 300A", "Intelligent PDU 200A"], vendors: ["Vertiv Group", "Schneider Electric", "Eaton Corporation"], count: 20 },
  { discipline: "Electrical", equipmentCategory: "busway", specSection: "26 25 00", descriptions: ["Busway 4000A Copper", "Busway 3000A Aluminum", "Bus Duct 2500A", "Overhead Busway 1600A"], vendors: ["Siemens Energy", "Schneider Electric", "Eaton Corporation"], count: 16 },
  { discipline: "Electrical", equipmentCategory: "ats", specSection: "26 36 23", descriptions: ["Automatic Transfer Switch 3000A", "ATS 2000A Closed Transition", "Bypass ATS 4000A", "Static Transfer Switch 1600A"], vendors: ["Eaton Corporation", "ASCO Power Technologies", "Schneider Electric"], count: 12 },
  { discipline: "Electrical", equipmentCategory: "cable_tray", specSection: "26 05 36", descriptions: ["Cable Tray Ladder Type 24\"", "Cable Tray Channel Type 18\"", "Wire Basket Tray 12\"", "Cable Tray Support System"], vendors: ["Cooper B-Line", "Snake Tray", "Panduit"], count: 14 },

  // Mechanical - ~90 items
  { discipline: "Mechanical", equipmentCategory: "chiller", specSection: "23 64 16", descriptions: ["Centrifugal Chiller 1500 Ton", "Centrifugal Chiller 1000 Ton", "Air-Cooled Chiller 500 Ton", "Screw Chiller 800 Ton"], vendors: ["Trane Technologies", "Johnson Controls", "Carrier Global"], count: 10 },
  { discipline: "Mechanical", equipmentCategory: "crah", specSection: "23 76 00", descriptions: ["CRAH Unit 100kW", "Precision Cooling Unit 75kW", "In-Row Cooling Unit 50kW", "CRAH Unit 150kW Glycol"], vendors: ["Vertiv Group", "Schneider Electric", "Stulz"], count: 24 },
  { discipline: "Mechanical", equipmentCategory: "cooling_tower", specSection: "23 65 00", descriptions: ["Induced Draft Cooling Tower 1500 Ton", "Crossflow Cooling Tower 1000 Ton", "Evaporative Condenser 800 Ton", "Cooling Tower Basin Heater Assembly"], vendors: ["SPX Cooling Technologies", "Baltimore Aircoil", "Evapco"], count: 8 },
  { discipline: "Mechanical", equipmentCategory: "pump", specSection: "23 21 23", descriptions: ["Chilled Water Pump 200HP", "Condenser Water Pump 150HP", "Glycol Circulation Pump 100HP", "Primary CHW Pump 250HP", "Secondary CHW Pump 125HP"], vendors: ["Grundfos", "Bell & Gossett", "Armstrong Fluid"], count: 18 },
  { discipline: "Mechanical", equipmentCategory: "piping", specSection: "23 21 13", descriptions: ["Chilled Water Piping 12\" Schedule 40", "Condenser Water Piping 16\"", "Glycol Piping System 8\"", "Piping Insulation System", "Expansion Tank 500 Gallon"], vendors: ["Victaulic", "NIBCO", "Watts Water"], count: 16 },
  { discipline: "Mechanical", equipmentCategory: "air_handler", specSection: "23 73 13", descriptions: ["Make-Up Air Handler 30,000 CFM", "Energy Recovery Unit 20,000 CFM", "Dedicated Outside Air Unit 15,000 CFM", "Rooftop AHU 25,000 CFM"], vendors: ["Trane Technologies", "Johnson Controls", "Daikin"], count: 12 },

  // Fire Protection - ~35 items
  { discipline: "Fire Protection", equipmentCategory: "fm200_suppression", specSection: "21 22 00", descriptions: ["FM-200 Clean Agent System - Hall A", "Novec 1230 Suppression System", "FM-200 System - Electrical Room", "Clean Agent Pre-Action System"], vendors: ["Fike Corporation", "Kidde Fire Systems", "Ansul"], count: 10 },
  { discipline: "Fire Protection", equipmentCategory: "fire_alarm", specSection: "28 31 00", descriptions: ["Fire Alarm Control Panel FACP-1", "Fire Alarm Annunciator Panel", "Notification Appliance Circuit", "Fire Alarm Network Module"], vendors: ["Notifier by Honeywell", "Simplex Grinnell", "Edwards EST"], count: 8 },
  { discipline: "Fire Protection", equipmentCategory: "sprinkler", specSection: "21 13 13", descriptions: ["Pre-Action Sprinkler System Zone A", "Wet Pipe Sprinkler System", "Dry Pipe Sprinkler Valve Assembly", "Pre-Action Sprinkler Zone B"], vendors: ["Viking Group", "Tyco Fire Products", "Reliable Sprinkler"], count: 10 },
  { discipline: "Fire Protection", equipmentCategory: "smoke_detection", specSection: "28 31 46", descriptions: ["VESDA Aspirating Smoke Detector", "Beam Smoke Detector Assembly", "Duct Smoke Detector", "Multi-Point Sampling System"], vendors: ["Xtralis (Honeywell)", "System Sensor", "Notifier by Honeywell"], count: 8 },

  // Structural - ~25 items
  { discipline: "Structural", equipmentCategory: "structural_steel", specSection: "05 12 00", descriptions: ["Structural Steel Columns W14x176", "Steel Beam Assembly W24x104", "Moment Frame Connection Detail", "Steel Brace Assembly HSS8x8", "Base Plate Assembly"], vendors: ["Nucor Corporation", "Steel Dynamics", "Commercial Metals"], count: 10 },
  { discipline: "Structural", equipmentCategory: "raised_floor", specSection: "09 69 13", descriptions: ["Raised Floor System 24\" Height", "Raised Floor Pedestal Assembly", "Heavy Load Floor Tile 2500 lb", "Perforated Floor Tile 25% Open", "Raised Floor Stringer System"], vendors: ["Tate Access Floors", "Haworth", "ASM Modular"], count: 10 },
  { discipline: "Structural", equipmentCategory: "concrete", specSection: "03 30 00", descriptions: ["Concrete Mix Design 5000 PSI", "Fiber Reinforced Concrete Mix", "Lightweight Concrete Topping", "Grout Mix Design Non-Shrink", "Concrete Sealer"], vendors: ["CEMEX", "LafargeHolcim", "Ready Mix USA"], count: 5 },

  // BMS/Controls - ~30 items
  { discipline: "BMS/Controls", equipmentCategory: "bms_controller", specSection: "25 00 00", descriptions: ["BMS Main Controller DDC", "BMS Field Controller", "Building Automation Server", "BMS Network Controller", "BMS Graphics Workstation"], vendors: ["Johnson Controls", "Schneider Electric", "Siemens Building"], count: 10 },
  { discipline: "BMS/Controls", equipmentCategory: "power_monitoring", specSection: "26 27 26", descriptions: ["Power Monitoring System PM8000", "Branch Circuit Monitor", "Power Quality Meter ION9000", "Energy Metering Panel", "CT/PT Metering Package"], vendors: ["Schneider Electric", "Eaton Corporation", "Vertiv Group"], count: 8 },
  { discipline: "BMS/Controls", equipmentCategory: "dcim", specSection: "25 50 00", descriptions: ["DCIM Software Platform License", "DCIM Asset Management Module", "DCIM Capacity Planning Module", "DCIM Environmental Monitoring"], vendors: ["Vertiv Group", "Schneider Electric", "Nlyte Software"], count: 6 },
  { discipline: "BMS/Controls", equipmentCategory: "sensors", specSection: "25 10 00", descriptions: ["Temperature/Humidity Sensor", "Water Leak Detection Cable", "Differential Pressure Sensor", "Airflow Sensor", "Power Sensor CT-Based", "Door Contact Sensor"], vendors: ["Schneider Electric", "Johnson Controls", "Setra Systems"], count: 8 },
];

const STATUSES = ["not_submitted", "submitted", "under_review", "approved", "approved_as_noted", "rejected", "resubmit"];

interface SubmittalSeedData {
  submittalNumber: string;
  specSection: string;
  description: string;
  equipmentCategory: string;
  discipline: string;
  vendor: string;
  reviewer: string;
  reviewerEmail: string;
  status: string;
  revision: number;
  submittedDate: Date | null;
  reviewDueDate: Date | null;
  approvedDate: Date | null;
  manufacturingLeadTimeWeeks: number;
  requiredOnSiteDate: Date;
  shippingBufferDays: number;
  poProcessingDays: number;
  vendorEmail: string;
  submitter: string;
  forceRisk?: "critical" | "high";
}

function generateSubmittals(): SubmittalSeedData[] {
  const submittals: SubmittalSeedData[] = [];
  let globalIndex = 0;

  const disciplinePrefixes: Record<string, string> = {
    Electrical: "E",
    Mechanical: "M",
    "Fire Protection": "FP",
    Structural: "S",
    "BMS/Controls": "BC",
  };

  for (const template of EQUIPMENT_TEMPLATES) {
    const prefix = disciplinePrefixes[template.discipline] || "X";
    const leadTimeRef = LEAD_TIME_REFS.find(r => r.equipmentCategory === template.equipmentCategory)!;
    const disciplineReviewers = REVIEWERS.filter(r => {
      if (template.discipline === "Electrical") return ["MEP Lead", "Electrical Engineer"].includes(r.role);
      if (template.discipline === "Mechanical") return ["MEP Lead", "Mechanical PM"].includes(r.role);
      if (template.discipline === "Fire Protection") return r.role === "Fire Protection Engineer";
      if (template.discipline === "Structural") return r.role === "Structural Engineer";
      return r.role === "Controls Specialist";
    });

    for (let i = 0; i < template.count; i++) {
      globalIndex++;
      const num = String(globalIndex).padStart(3, "0");
      const submittalNumber = `${prefix}-${num}`;
      const description = template.descriptions[i % template.descriptions.length];
      const vendor = template.vendors[i % template.vendors.length];
      const reviewer = pick(disciplineReviewers);

      // Stagger submission dates by discipline
      const disciplineOffset: Record<string, number> = {
        Structural: 0,
        Electrical: 15,
        Mechanical: 25,
        "Fire Protection": 40,
        "BMS/Controls": 60,
      };
      const baseOffset = disciplineOffset[template.discipline] || 0;
      const submissionDelay = baseOffset + rand(0, 90);
      const submittedDate = addDays(NTP_DATE, submissionDelay);

      // Lead time with variance
      const variance = randFloat(-0.1, 0.1);
      const mfgLeadWeeks = Math.round(leadTimeRef.typicalLeadTimeWeeks * (1 + variance));

      // Required on site: work backward from target completion
      const installationBuffer = rand(60, 120);
      const requiredOnSiteDate = addDays(TARGET_COMPLETION, -installationBuffer);

      // Review due date
      const reviewDays = leadTimeRef.typicalReviewDays + rand(-3, 5);
      const reviewDueDate = addDays(submittedDate, reviewDays);

      // Status assignment based on probabilities
      let status: string;
      let approvedDate: Date | null = null;
      let revision = 0;
      const statusRoll = rng();

      if (submittedDate > TODAY) {
        status = "not_submitted";
      } else if (statusRoll < 0.15) {
        status = "not_submitted";
      } else if (statusRoll < 0.35) {
        status = "submitted";
      } else if (statusRoll < 0.60) {
        status = "under_review";
      } else if (statusRoll < 0.75) {
        status = "approved";
        approvedDate = addDays(reviewDueDate, rand(-5, 10));
      } else if (statusRoll < 0.82) {
        status = "approved_as_noted";
        approvedDate = addDays(reviewDueDate, rand(0, 14));
      } else if (statusRoll < 0.90) {
        status = "rejected";
        revision = 1;
      } else {
        status = "resubmit";
        revision = 1;
      }

      const vendorDomains: Record<string, string> = {
        "Siemens Energy": "siemens-energy.com",
        "ABB Ltd": "abb.com",
        "Schneider Electric": "se.com",
        "Eaton Corporation": "eaton.com",
        "Vertiv Group": "vertiv.com",
        "Caterpillar Power": "cat.com",
        "Cummins Power": "cummins.com",
        "Trane Technologies": "tranetechnologies.com",
        "Johnson Controls": "jci.com",
      };
      const domain = vendorDomains[vendor] || "vendor.com";
      const vendorEmail = `submittals@${domain}`;

      submittals.push({
        submittalNumber,
        specSection: template.specSection,
        description: `${description}${template.count > 4 ? ` - Unit ${i + 1}` : ""}`,
        equipmentCategory: template.equipmentCategory,
        discipline: template.discipline,
        vendor,
        reviewer: `${reviewer.name} - ${reviewer.role}`,
        reviewerEmail: reviewer.email,
        status,
        revision,
        submittedDate: status === "not_submitted" ? null : submittedDate,
        reviewDueDate: status === "not_submitted" ? null : reviewDueDate,
        approvedDate,
        manufacturingLeadTimeWeeks: mfgLeadWeeks,
        requiredOnSiteDate,
        shippingBufferDays: rand(10, 21),
        poProcessingDays: rand(7, 14),
        vendorEmail,
        submitter: "Mike Johnson - Project Engineer",
      });
    }
  }

  // Now inject deliberate risk scenarios

  // CRITICAL: MV Transformers with overdue reviews
  const criticalIndices = submittals
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.equipmentCategory === "mv_transformer" && s.status !== "approved" && s.status !== "approved_as_noted")
    .slice(0, 4);

  for (const { i } of criticalIndices) {
    submittals[i].status = "under_review";
    submittals[i].submittedDate = addDays(TODAY, -35);
    submittals[i].reviewDueDate = addDays(TODAY, -14); // 2 weeks overdue
    submittals[i].approvedDate = null;
    submittals[i].forceRisk = "critical";
  }

  // CRITICAL: 15kV Switchgear overdue
  const criticalSwitchgear = submittals
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.equipmentCategory === "switchgear_15kv" && s.status !== "approved" && s.status !== "approved_as_noted")
    .slice(0, 2);

  for (const { i } of criticalSwitchgear) {
    submittals[i].status = "under_review";
    submittals[i].submittedDate = addDays(TODAY, -28);
    submittals[i].reviewDueDate = addDays(TODAY, -10);
    submittals[i].approvedDate = null;
    submittals[i].forceRisk = "critical";
  }

  // HIGH: UPS and Generators with tight margins
  const highRiskCategories = ["ups_system", "generator", "chiller"];
  for (const cat of highRiskCategories) {
    const candidates = submittals
      .map((s, i) => ({ s, i }))
      .filter(({ s }) => s.equipmentCategory === cat && s.status === "under_review")
      .slice(0, 3);

    for (const { i } of candidates) {
      submittals[i].reviewDueDate = addDays(TODAY, rand(3, 8)); // Due very soon
      submittals[i].forceRisk = "high";
    }
  }

  return submittals;
}

async function main() {
  console.log("Seeding database...");

  // Clear existing data
  await prisma.escalation.deleteMany();
  await prisma.submittalStatusHistory.deleteMany();
  await prisma.submittal.deleteMany();
  await prisma.project.deleteMany();
  await prisma.leadTimeReference.deleteMany();
  await prisma.uploadLog.deleteMany();

  // Create lead time references
  for (const ref of LEAD_TIME_REFS) {
    await prisma.leadTimeReference.create({ data: ref });
  }
  console.log(`Created ${LEAD_TIME_REFS.length} lead time references`);

  // Create project
  const project = await prisma.project.create({
    data: {
      name: "Hyperion Data Center DC-01",
      code: "HDC-DC01",
      description: "40MW Hyperscaler Data Center Facility",
      location: "Ashburn, Virginia",
      capacityMw: 40,
      owner: "Hyperion Cloud Services",
      epc: "Meridian Construction Group",
      noticeToProceedDate: NTP_DATE,
      targetCompletionDate: TARGET_COMPLETION,
    },
  });
  console.log(`Created project: ${project.name}`);

  // Generate and create submittals
  const submittalData = generateSubmittals();
  let createdCount = 0;

  for (const data of submittalData) {
    const { forceRisk, ...submittalFields } = data;
    await prisma.submittal.create({
      data: {
        ...submittalFields,
        projectId: project.id,
        submittalType: "product_data",
      },
    });
    createdCount++;
  }

  console.log(`Created ${createdCount} submittals`);

  // Summary
  const statusCounts = await prisma.submittal.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  console.log("\nStatus distribution:");
  for (const s of statusCounts) {
    console.log(`  ${s.status}: ${s._count.id}`);
  }

  const categoryCounts = await prisma.submittal.groupBy({
    by: ["discipline"],
    _count: { id: true },
  });
  console.log("\nDiscipline distribution:");
  for (const c of categoryCounts) {
    console.log(`  ${c.discipline}: ${c._count.id}`);
  }

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
