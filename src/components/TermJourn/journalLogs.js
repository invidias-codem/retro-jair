/**
 * @typedef {Object} JournalEntry
 * @property {string} id - Unique identifier for the entry
 * @property {string} date - Date in MM.DD.YYYY format
 * @property {string} title - Entry title
 * @property {string} initialStatus - System status at time of entry
 * @property {string} content - Main content of the entry
 * @property {string} details - Additional metrics and details
 * @property {string[]} alerts - Array of active system alerts
 */

/**
 * Constant containing all journal entries for Jair Enterprises
 * @type {JournalEntry[]}
 */
const JOURNAL_ENTRIES = [
  {
    id: "JE001",
    date: "02.17.2025",
    title: "Foundation Day - Jair Enterprises Launch",
    initialStatus: "SYSTEMS OPERATIONAL",
    content: [
      ">INITIALIZING ENTERPRISE FRAMEWORK...",
      ">ESTABLISHING FAMILY COUNCIL...",
      ">VISION STATEMENT DEFINED",
      "",
      "Today marks the official launch of Jair Enterprises. Family council has approved our initial constitution and governance structure. Core values established: Innovation, Family Unity, Social Impact."
    ].join('\n'),
    details: [
      "Launch Metrics:",
      "- Family Council Members: 7",
      "- Initial Departments: 4",
      "- Seed Capital: Secured",
      "- Legal Structure: Family Trust & LLC hybrid"
    ].join('\n'),
    alerts: [
      "Pending trademark registration for family brand",
      "Family council orientation scheduled"
    ]
  },
  {
    id: "JE002",
    date: "03.01.2025",
    title: "Educational Trust Implementation",
    initialStatus: "FRAMEWORK EXPANDING",
    content: [
      ">ACCESSING EDUCATION PROTOCOLS...",
      ">ESTABLISHING SCHOLARSHIP CRITERIA...",
      ">FUND ALLOCATION COMPLETE",
      "",
      "Educational trust foundation completed. First round of family scholarships to be awarded next quarter. Focus areas: Technology, Business Administration, Sustainable Development."
    ].join('\n'),
    details: [
      "Education Initiative Status:",
      "- Trust Fund: Active",
      "- Annual Scholarship Slots: 5",
      "- Mentorship Programs: 3",
      "- Skills Development Tracks: 4"
    ].join('\n'),
    alerts: [
      "First scholarship applications due in 30 days",
      "Mentorship program launching next month"
    ]
  },
  {
    id: "JE003",
    date: "04.15.2025",
    title: "Innovation Hub Launch",
    initialStatus: "INNOVATION PROTOCOLS ACTIVE",
    content: [
      ">INITIALIZING R&D FRAMEWORK...",
      ">ESTABLISHING INNOVATION METRICS...",
      ">RESEARCH GRANTS ALLOCATED",
      "",
      "Innovation hub successfully launched. First wave of family-led projects approved for funding. Focus on sustainable technology solutions and digital transformation."
    ].join('\n'),
    details: [
      "Innovation Metrics:",
      "- Active Projects: 6",
      "- Research Partners: 4",
      "- Patent Applications: 2",
      "- Development Teams: 3"
    ].join('\n'),
    alerts: [
      "Project funding review scheduled",
      "Patent pending status on key innovations"
    ]
  },
  {
    id: "JE004",
    date: "05.20.2025",
    title: "Community Impact Initiative",
    initialStatus: "SOCIAL RESPONSIBILITY ENGAGED",
    content: [
      ">ANALYZING COMMUNITY NEEDS...",
      ">ESTABLISHING OUTREACH PROGRAMS...",
      ">IMPACT METRICS DEFINED",
      "",
      "Jair Foundation officially registered. First community programs launched focusing on tech education and environmental sustainability. Family members actively engaged in program leadership."
    ].join('\n'),
    details: [
      "Social Impact Metrics:",
      "- Active Programs: 5",
      "- Community Partners: 8",
      "- Volunteer Hours: 450",
      "- Direct Beneficiaries: 200+"
    ].join('\n'),
    alerts: [
      "Grant applications open for community projects",
      "Environmental impact assessment pending"
    ]
  },
  {
    id: "JE005",
    date: "06.30.2025",
    title: "Strategic Alliance Formation",
    initialStatus: "NETWORK EXPANSION ACTIVE",
    content: [
      ">INITIATING PARTNERSHIP PROTOCOLS...",
      ">ANALYZING SYNERGY POTENTIAL...",
      ">AGREEMENTS FORMALIZED",
      "",
      "Strategic partnerships established with three leading family enterprises. Joint ventures in sustainable technology and education technology sectors approved by family council."
    ].join('\n'),
    details: [
      "Partnership Framework:",
      "- Active Alliances: 3",
      "- Joint Ventures: 2",
      "- Market Expansion: 4 regions",
      "- Shared Resources: Active"
    ].join('\n'),
    alerts: [
      "Due diligence review for new partnerships",
      "Joint venture launch preparation in progress"
    ]
  },
  {
    id: "JE006",
    date: "07.15.2025",
    title: "Relocation and New Partnership",
    initialStatus: "STRATEGIC EXPANSION",
    content: [
      ">INITIATING RELOCATION PROTOCOLS...",
      ">ESTABLISHING NEW PARTNERSHIP...",
      ">INTEGRATING REGIONAL STRATEGY...",
      "",
      "Moved to Colorado Springs, CO. Initiated a strategic partnership with US Computer Support to expand our technology service offerings and regional presence. This move aligns with our long-term growth and innovation objectives."
    ].join('\n'),
    details: [
      "Relocation & Partnership Metrics:",
      "- New Location: Colorado Springs, CO",
      "- Partner: US Computer Support",
      "- Service Expansion: Technology Support, IT Solutions",
      "- Regional Focus: Mountain West Region"
    ].join('\n'),
    alerts: [
      "Integration plan with US Computer Support in progress",
      "Community engagement in Colorado Springs scheduled"
    ]
  }
];
  
  // Freeze the array to prevent accidental modifications
  Object.freeze(JOURNAL_ENTRIES);
  
  // Export frozen array as default
  export default JOURNAL_ENTRIES;
  
  // Named exports for additional flexibility
  export const getEntryById = (id) => JOURNAL_ENTRIES.find(entry => entry.id === id);
  export const getAllEntries = () => [...JOURNAL_ENTRIES];
  export const getLatestEntry = () => JOURNAL_ENTRIES[JOURNAL_ENTRIES.length - 1];