import pkg from "@prisma/client";
const { PrismaClient } = pkg;

const prisma = new PrismaClient();

const categories = [
  {
    name: "Perimeter Security",
    description: "Fencing, gates, barriers, and boundary controls",
    weight: 1.2,
    sortOrder: 1,
    items: [
      "Perimeter fencing in good condition (no gaps, damage, or easy climb points)",
      "Vehicle barriers or bollards at building entrances",
      "Controlled vehicle entry/exit points with proper signage",
      "Perimeter lighting adequate for nighttime visibility",
      "Clear zones maintained around perimeter (no concealment areas)",
      "Gates secured with appropriate locks or access controls",
      "Anti-climb measures on fencing (barbed wire, spikes, etc.)",
      "Perimeter intrusion detection systems installed",
      "Landscaping maintained to prevent concealment near perimeter",
      "Loading dock areas secured and monitored",
    ],
  },
  {
    name: "Access Control",
    description: "Entry points, locks, key management, and visitor procedures",
    weight: 1.3,
    sortOrder: 2,
    items: [
      "Main entrance has controlled access (badge, key card, buzzer)",
      "Secondary entrances secured and alarmed when not in use",
      "Visitor sign-in/sign-out procedures enforced",
      "Visitor badges or escorts required",
      "Key/access card management system in place",
      "Master key control and audit procedures",
      "Door hardware in good working condition",
      "Emergency exits alarmed but accessible from inside",
      "After-hours access procedures documented and followed",
      "Roof access points secured",
      "Utility room/mechanical room access restricted",
      "Server/IT room access restricted and logged",
    ],
  },
  {
    name: "Surveillance Systems",
    description: "CCTV cameras, monitoring, and recording capabilities",
    weight: 1.1,
    sortOrder: 3,
    items: [
      "CCTV cameras cover all entry/exit points",
      "CCTV cameras cover parking areas",
      "CCTV cameras cover interior common areas",
      "Camera footage recorded and retained (minimum 30 days)",
      "Camera system regularly maintained and tested",
      "Adequate camera resolution for identification",
      "Night vision or IR cameras where needed",
      "Camera placement avoids blind spots",
      "Live monitoring capability available",
      "Signage indicating surveillance in use",
    ],
  },
  {
    name: "Lighting",
    description: "Interior and exterior lighting for safety and deterrence",
    weight: 0.9,
    sortOrder: 4,
    items: [
      "Exterior lighting covers all walkways and entrances",
      "Parking lot/structure adequately lit",
      "Emergency/backup lighting functional",
      "Motion-activated lighting in key areas",
      "Interior lighting adequate in all occupied spaces",
      "Stairwell lighting adequate",
      "Lighting timer or photocell controls working",
      "No dark spots or shadowed areas near building",
      "Loading/delivery areas well lit",
      "Landscape lighting maintained",
    ],
  },
  {
    name: "Alarm & Detection Systems",
    description: "Intrusion alarms, fire detection, and emergency notification",
    weight: 1.2,
    sortOrder: 5,
    items: [
      "Intrusion alarm system installed and monitored",
      "Alarm system tested regularly (monthly minimum)",
      "Fire alarm system installed and inspected",
      "Smoke/heat detectors in all required areas",
      "Fire sprinkler system installed and inspected",
      "Panic/duress alarm buttons at key locations",
      "Glass break sensors on vulnerable windows",
      "Motion detectors in critical areas",
      "Alarm response procedures documented",
      "Central monitoring station response verified",
    ],
  },
  {
    name: "Emergency Preparedness",
    description: "Emergency plans, drills, equipment, and communication",
    weight: 1.1,
    sortOrder: 6,
    items: [
      "Written emergency action plan exists and is current",
      "Emergency evacuation routes posted",
      "Emergency drills conducted regularly",
      "First aid kits accessible and stocked",
      "AED (defibrillator) available and maintained",
      "Emergency communication system (PA, mass notification)",
      "Shelter-in-place procedures documented",
      "Active threat/active shooter plan in place",
      "Emergency contacts list current and posted",
      "Relationships established with local law enforcement/fire",
    ],
  },
  {
    name: "Personnel Security",
    description: "Staffing, training, background checks, and security culture",
    weight: 1.0,
    sortOrder: 7,
    items: [
      "Security personnel on-site (guard, receptionist, volunteer)",
      "Background checks conducted on employees/volunteers",
      "Security awareness training provided to staff",
      "New employee/volunteer security orientation",
      "Incident reporting procedures known by staff",
      "Workplace violence prevention program",
      "Termination procedures include access revocation",
      "Security team/committee established",
      "Regular security briefings or updates provided",
      "Children/vulnerable population safeguarding procedures",
    ],
  },
  {
    name: "Cybersecurity & Information",
    description: "Network security, data protection, and IT infrastructure",
    weight: 0.8,
    sortOrder: 8,
    items: [
      "Wi-Fi networks secured with strong passwords",
      "Guest Wi-Fi separated from internal network",
      "Firewall and antivirus protection current",
      "Software and systems regularly updated/patched",
      "Data backup procedures in place and tested",
      "Sensitive documents secured (locked storage)",
      "Clean desk policy or secure document handling",
      "Password policies enforced",
      "Physical security of IT infrastructure (servers, networking)",
      "Social engineering awareness training provided",
    ],
  },
  {
    name: "Environmental Design (CPTED)",
    description: "Natural surveillance, access control, and territorial reinforcement",
    weight: 0.9,
    sortOrder: 9,
    items: [
      "Natural surveillance — clear sightlines from inside to outside",
      "Territorial reinforcement — clear property boundaries",
      "Natural access control — pathways guide visitors to entrances",
      "Maintenance and image — property well maintained",
      "Signage clearly marks entrances, exits, and restricted areas",
      "Gathering areas visible and well-defined",
      "Parking areas have clear sightlines",
      "Trash/recycling areas secured and not concealment risks",
      "Building numbering/addressing clearly visible from street",
      "Wayfinding signage adequate for visitors",
    ],
  },
  {
    name: "Policies & Documentation",
    description: "Security policies, procedures, and compliance records",
    weight: 0.8,
    sortOrder: 10,
    items: [
      "Written security policy exists and is current",
      "Security policies reviewed and updated annually",
      "Incident response plan documented",
      "Incident log maintained and reviewed",
      "Insurance coverage adequate for security incidents",
      "Compliance with applicable regulations (OSHA, ADA, fire code)",
      "Contractor/vendor security requirements documented",
      "Security budget allocated and reviewed",
      "Previous security assessments documented",
      "Corrective action tracking from prior assessments",
    ],
  },
];

async function main() {
  await prisma.checklistResponse.deleteMany();
  await prisma.checklistItem.deleteMany();
  await prisma.checklistCategory.deleteMany();

  for (const cat of categories) {
    const category = await prisma.checklistCategory.create({
      data: {
        name: cat.name,
        description: cat.description,
        weight: cat.weight,
        sortOrder: cat.sortOrder,
      },
    });

    for (let i = 0; i < cat.items.length; i++) {
      await prisma.checklistItem.create({
        data: {
          categoryId: category.id,
          text: cat.items[i],
          sortOrder: i + 1,
        },
      });
    }
  }

  const total = categories.reduce((sum, c) => sum + c.items.length, 0);
  console.log(`Seeded 10 categories with ${total} items`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
