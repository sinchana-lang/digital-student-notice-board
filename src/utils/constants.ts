import gatDigitalLibrary from '../assets/gat/gat_digital_library.webp';
import gatEvents1 from '../assets/gat/gat_events_1.webp';
import gatEvents2 from '../assets/gat/gat_events_2.webp';
import gatEvents3 from '../assets/gat/gat_events_3.webp';
import gatHeroBuilding from '../assets/gat/gat_hero_slide2.webp';
import gatHeroCampus from '../assets/gat/gat_hero_slide3.webp';
import gatLibrary from '../assets/gat/gat_library.webp';
import gatLogo from '../assets/gat/gat_logo.webp';
import gatLogoWhite from '../assets/gat/gat_logo_white.webp';
import gatSeminarHall from '../assets/gat/gat_main_building.jpg';
import gatReadingRoom from '../assets/gat/gat_reading_room.webp';
import gatSportsGround from '../assets/gat/gat_sports_ground.jpg';
import type { CampusEvent, Department, Notice, NoticeCategory } from '../types';

export const BOOTSTRAPPED_ADMIN_EMAIL = 'sinchanajsinchu972@gmail.com';

export const GAT_COLLEGE_INFO = {
  name: 'Global Academy of Technology',
  shortName: 'GAT Bengaluru',
  tagline: 'Autonomous Institute, Affiliated to VTU',
  locationShort: 'Rajarajeshwari Nagar, Bengaluru',
  address: 'Aditya Layout, Rajarajeshwari Nagar, Bengaluru, Karnataka – 560098',
  website: 'https://gat.ac.in/',
  mapsUrl: 'https://maps.app.goo.gl/EjNS36SEesnqMcvo6',
  mapsEmbedUrl:
    'https://maps.google.com/maps?q=Global%20Academy%20of%20Technology%20Rajarajeshwari%20Nagar%20Bengaluru&t=&z=16&ie=UTF8&iwloc=&output=embed',
  generalPhone: '080-28603158 / 080-28603157',
  admissionsPhone: '+91-9902463002, +91-9243190105, +91-8050003067',
  email: 'info@gat.ac.in',
  admissionsEmail: 'admissions@gat.ac.in',
};

export const CAMPUS_ASSETS = {
  logoColor: gatLogo,
  logoWhite: gatLogoWhite,
  heroBuilding: gatHeroBuilding,
  heroCampusAvenue: gatHeroCampus,
  seminarHall: gatSeminarHall,
  library: gatLibrary,
  digitalLibrary: gatDigitalLibrary,
  readingRoom: gatReadingRoom,
  sportsGround: gatSportsGround,
  event1: gatEvents1,
  event2: gatEvents2,
  event3: gatEvents3,
};

export const GAT_CAMPUS_GALLERY = [
  {
    title: 'Main Academic Building',
    subtitle: 'Central administrative block and iconic campus facade at Rajarajeshwari Nagar',
    image: gatHeroBuilding,
  },
  {
    title: 'Central Library & Information Center',
    subtitle: 'Over 35,000+ volumes, digital OPAC terminals, and quiet reading spaces',
    image: gatReadingRoom,
  },
  {
    title: 'ICT-Enabled Seminar & Lecture Hall',
    subtitle: 'Tiered academic halls for technical symposia, workshops, and placement briefings',
    image: gatSeminarHall,
  },
  {
    title: 'Campus Avenue & Transport Fleet',
    subtitle: 'Eco-friendly green campus with dedicated student transport connectivity',
    image: gatHeroCampus,
  },
];

export const NOTICE_CATEGORIES: NoticeCategory[] = [
  'General Announcements',
  'Examination Notifications',
  'Internal Assessment',
  'Results',
  'Academic Calendar',
  'Holidays',
  'Department Updates',
  'Placement Notifications',
  'Workshops and Seminars',
  'Technical Events',
  'Cultural Events',
  'Sports Activities',
  'Internship Opportunities',
  'Important Circulars',
];

export const YEAR_OPTIONS = [
  'all',
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year',
  'PG 1st Year',
  'PG 2nd Year',
];

export const SEMESTER_OPTIONS = [
  'all',
  'Sem 1',
  'Sem 2',
  'Sem 3',
  'Sem 4',
  'Sem 5',
  'Sem 6',
  'Sem 7',
  'Sem 8',
];

export const DEFAULT_DEPARTMENTS: Omit<Department, 'createdAt' | 'updatedAt'>[] = [
  // 10 Undergraduate Programs
  {
    id: 'cse',
    code: 'CSE',
    name: 'Computer Science and Engineering',
    shortName: 'CSE',
    programLevel: 'UG',
    active: true,
    displayOrder: 1,
  },
  {
    id: 'cse-aiml',
    code: 'CSE (AI & ML)',
    name: 'Computer Science and Engineering (AI & ML)',
    shortName: 'CSE (AI & ML)',
    programLevel: 'UG',
    active: true,
    displayOrder: 2,
  },
  {
    id: 'aiml',
    code: 'AI & ML',
    name: 'Artificial Intelligence and Machine Learning',
    shortName: 'AI & ML',
    programLevel: 'UG',
    active: true,
    displayOrder: 3,
  },
  {
    id: 'aids',
    code: 'AI & DS',
    name: 'Artificial Intelligence and Data Science',
    shortName: 'AI & DS',
    programLevel: 'UG',
    active: true,
    displayOrder: 4,
  },
  {
    id: 'ise',
    code: 'ISE',
    name: 'Information Science and Engineering',
    shortName: 'ISE',
    programLevel: 'UG',
    active: true,
    displayOrder: 5,
  },
  {
    id: 'ece',
    code: 'ECE',
    name: 'Electronics and Communication Engineering',
    shortName: 'ECE',
    programLevel: 'UG',
    active: true,
    displayOrder: 6,
  },
  {
    id: 'eee',
    code: 'EEE',
    name: 'Electrical and Electronics Engineering',
    shortName: 'EEE',
    programLevel: 'UG',
    active: true,
    displayOrder: 7,
  },
  {
    id: 'mech',
    code: 'ME',
    name: 'Mechanical Engineering',
    shortName: 'ME',
    programLevel: 'UG',
    active: true,
    displayOrder: 8,
  },
  {
    id: 'civil',
    code: 'CE',
    name: 'Civil Engineering',
    shortName: 'CE',
    programLevel: 'UG',
    active: true,
    displayOrder: 9,
  },
  {
    id: 'aero',
    code: 'AE',
    name: 'Aeronautical Engineering',
    shortName: 'AE',
    programLevel: 'UG',
    active: true,
    displayOrder: 10,
  },
  // 3 Postgraduate Programs
  {
    id: 'mtech-cse',
    code: 'M.Tech CSE',
    name: 'M.Tech Computer Science and Engineering',
    shortName: 'M.Tech CSE',
    programLevel: 'PG',
    active: true,
    displayOrder: 11,
  },
  {
    id: 'mtech-structural',
    code: 'M.Tech SE',
    name: 'M.Tech Structural Engineering',
    shortName: 'M.Tech SE',
    programLevel: 'PG',
    active: true,
    displayOrder: 12,
  },
  {
    id: 'mba',
    code: 'MBA',
    name: 'MBA – Master of Business Administration',
    shortName: 'MBA',
    programLevel: 'PG',
    active: true,
    displayOrder: 13,
  },
];

const now = Date.now();
const dayMs = 86400000;

export const SAMPLE_NOTICES: Notice[] = [
  {
    id: 'sample-notice-exam-schedule',
    title: 'Sample Notice: Odd Semester End-Term Examination Guidelines & Seating Protocol',
    summary:
      'Sample demonstration circular outlining examination hall reporting times, admit card verification, and permitted calculator models for all UG (B.E.) and PG (M.Tech / MBA) cohorts.',
    content:
      'SAMPLE DEMONSTRATION DATA — For illustration of the GAT digital notice board workflow only.\n\nAll regular and supplementary candidates appearing for the upcoming Odd Semester End-Term Examinations at Global Academy of Technology are advised to report to their respective examination blocks 25 minutes prior to the scheduled session.\n\nKey Instructions:\n1. Students must carry their valid GAT College ID Card and signed Hall Ticket for every paper.\n2. Electronic smartwatches, programmable devices, and mobile phones are strictly prohibited inside the examination rooms.\n3. Department coordinators have uploaded room-wise seating plans on the digital portal.\n\nFor clarifications, please contact the Examination Cell or your Department Coordinator.',
    category: 'Examination Notifications',
    departmentIds: [],
    targetAllDepartments: true,
    targetYear: 'all',
    targetSemester: 'all',
    priority: 'urgent',
    pinned: true,
    status: 'published',
    publishAt: new Date(now - 1 * dayMs),
    expiresAt: new Date(now + 30 * dayMs),
    authorId: 'sample-admin',
    authorName: 'Office of Controller of Examinations (Sample)',
    authorRole: 'admin',
    attachments: [
      {
        name: 'Sample_GAT_Exam_Protocol_Circular.pdf',
        url: 'sample://exam-protocol',
        type: 'application/pdf',
        size: 184320,
      },
    ],
    isSample: true,
    createdAt: new Date(now - 1 * dayMs),
    updatedAt: new Date(now - 1 * dayMs),
  },
  {
    id: 'sample-notice-ia-timetable',
    title: 'Sample Notice: Second Internal Assessment (IA-2) Timetable for Computing Programs',
    summary:
      'Sample department circular detailing IA-2 test timings and lab evaluation dates for CSE, CSE (AI & ML), AI & ML, AI & DS, and ISE.',
    content:
      'SAMPLE DEMONSTRATION DATA — Replace or archive once live department circulars are published.\n\nThe Second Internal Assessment (IA-2) for 2nd, 3rd, and 4th year B.E. students across CSE, CSE (AI & ML), AI & ML, AI & DS, and ISE will be conducted across morning and afternoon slots.\n\nAssessment Guidelines:\n- Morning Slot: 09:30 AM – 11:00 AM\n- Afternoon Slot: 02:00 PM – 03:30 PM\n- Blue books will be issued at the classroom 10 minutes before commencement.',
    category: 'Internal Assessment',
    departmentIds: ['cse', 'cse-aiml', 'aiml', 'aids', 'ise'],
    targetAllDepartments: false,
    targetYear: '3rd Year',
    targetSemester: 'Sem 5',
    priority: 'important',
    pinned: true,
    status: 'published',
    publishAt: new Date(now - 2 * dayMs),
    expiresAt: new Date(now + 21 * dayMs),
    authorId: 'sample-faculty-cse',
    authorName: 'Computing Cluster Coordinator (Sample)',
    authorRole: 'faculty',
    attachments: [
      {
        name: 'Sample_IA2_Timetable_Schedule.pdf',
        url: 'sample://ia2-timetable',
        type: 'application/pdf',
        size: 142500,
      },
    ],
    isSample: true,
    createdAt: new Date(now - 2 * dayMs),
    updatedAt: new Date(now - 2 * dayMs),
  },
  {
    id: 'sample-notice-pg-research',
    title: 'Sample Notice: Postgraduate Thesis & Project Synopsis Submission (M.Tech & MBA)',
    summary:
      'Sample PG circular notifying M.Tech CSE, M.Tech Structural Engineering, and MBA students of synopsis presentation dates and formatting templates.',
    content:
      'SAMPLE DEMONSTRATION DATA — Illustrates Postgraduate program notices.\n\nAll PG 1st Year and PG 2nd Year students enrolled in M.Tech Computer Science and Engineering, M.Tech Structural Engineering, and MBA are requested to submit their approved project/dissertation synopsis to their respective PG Coordinators.',
    category: 'Department Updates',
    departmentIds: ['mtech-cse', 'mtech-structural', 'mba'],
    targetAllDepartments: false,
    targetYear: 'PG 2nd Year',
    targetSemester: 'Sem 3',
    priority: 'important',
    pinned: false,
    status: 'published',
    publishAt: new Date(now - 3 * dayMs),
    expiresAt: new Date(now + 25 * dayMs),
    authorId: 'sample-admin',
    authorName: 'PG Academic Cell, GAT (Sample)',
    authorRole: 'admin',
    attachments: [],
    isSample: true,
    createdAt: new Date(now - 3 * dayMs),
    updatedAt: new Date(now - 3 * dayMs),
  },
  {
    id: 'sample-notice-placement-prep',
    title: 'Sample Notice: Campus Placement Readiness & Technical Aptitude Bootcamp',
    summary:
      'Sample Training & Placement cell notice inviting pre-final year B.E. students across all engineering branches to register for aptitude and system design clinics.',
    content:
      'SAMPLE DEMONSTRATION DATA — Illustrates Placement Notifications category.\n\nThe Training and Placement Cell at Global Academy of Technology is organizing a structured technical readiness workshop covering Data Structures, Core Engineering Fundamentals, and Quantitative Aptitude for 3rd Year and 4th Year students.',
    category: 'Placement Notifications',
    departmentIds: ['cse', 'cse-aiml', 'aiml', 'aids', 'ise', 'ece', 'eee', 'mech', 'civil', 'aero'],
    targetAllDepartments: false,
    targetYear: '3rd Year',
    targetSemester: 'Sem 6',
    priority: 'normal',
    pinned: false,
    status: 'published',
    publishAt: new Date(now - 4 * dayMs),
    expiresAt: new Date(now + 35 * dayMs),
    authorId: 'sample-admin',
    authorName: 'Training & Placement Cell (Sample)',
    authorRole: 'admin',
    attachments: [],
    isSample: true,
    createdAt: new Date(now - 4 * dayMs),
    updatedAt: new Date(now - 4 * dayMs),
  },
  {
    id: 'sample-notice-ece-workshop',
    title: 'Sample Notice: Embedded Systems, VLSI & Aerodynamics Interdisciplinary Seminar',
    summary:
      'Sample department seminar announcement for ECE, EEE, Mechanical, and Aeronautical Engineering students.',
    content:
      'SAMPLE DEMONSTRATION DATA — Illustrates Workshops and Seminars category.\n\nThe Departments of ECE, EEE, ME, and AE invite students to a technical seminar on Hardware-in-the-Loop Simulation and Avionics Control Systems.',
    category: 'Workshops and Seminars',
    departmentIds: ['ece', 'eee', 'mech', 'aero'],
    targetAllDepartments: false,
    targetYear: '2nd Year',
    targetSemester: 'Sem 4',
    priority: 'normal',
    pinned: false,
    status: 'published',
    publishAt: new Date(now - 5 * dayMs),
    expiresAt: new Date(now + 18 * dayMs),
    authorId: 'sample-faculty-ece',
    authorName: 'Department of ECE & AE (Sample)',
    authorRole: 'faculty',
    attachments: [],
    isSample: true,
    createdAt: new Date(now - 5 * dayMs),
    updatedAt: new Date(now - 5 * dayMs),
  },
];

export const SAMPLE_EVENTS: CampusEvent[] = [
  {
    id: 'sample-event-hackathon',
    title: 'Sample Event: GAT Annual Technical Symposium & Innovation Showcase',
    description:
      'SAMPLE DEMONSTRATION DATA — Inter-departmental engineering symposium featuring project exhibitions, technical paper presentations, and coding challenges at Global Academy of Technology.',
    posterUrl: gatEvents2,
    eventDate: '2026-11-28',
    eventTime: '09:00 AM – 05:00 PM',
    venue: 'Main Auditorium & Seminar Block, GAT Campus',
    departmentId: 'cse',
    departmentName: 'Computer Science and Engineering (CSE)',
    registrationLink: 'https://gat.ac.in/',
    registrationDeadline: '2026-11-24',
    status: 'upcoming',
    authorId: 'sample-admin',
    authorName: 'Technical Club Coordinator (Sample)',
    isSample: true,
    createdAt: new Date(now - 2 * dayMs),
    updatedAt: new Date(now - 2 * dayMs),
  },
  {
    id: 'sample-event-placement-conclave',
    title: 'Sample Event: Industry Leadership & Placement Conclave',
    description:
      'SAMPLE DEMONSTRATION DATA — Interactive leadership talk and career guidance seminar at the GAT tiered seminar hall for UG and MBA cohorts.',
    posterUrl: gatSeminarHall,
    eventDate: '2026-12-05',
    eventTime: '10:30 AM – 01:30 PM',
    venue: 'Tiered Seminar Hall, GAT Main Block',
    departmentId: 'mba',
    departmentName: 'MBA – Master of Business Administration',
    registrationLink: 'https://gat.ac.in/',
    registrationDeadline: '2026-12-02',
    status: 'upcoming',
    authorId: 'sample-admin',
    authorName: 'Placement & MBA Cell (Sample)',
    isSample: true,
    createdAt: new Date(now - 3 * dayMs),
    updatedAt: new Date(now - 3 * dayMs),
  },
  {
    id: 'sample-event-cultural-evening',
    title: 'Sample Event: Campus Cultural & Literary Conclave',
    description:
      'SAMPLE DEMONSTRATION DATA — Campus-wide student auditorium showcase celebrating arts, literature, and department club achievements at GAT.',
    posterUrl: gatEvents1,
    eventDate: '2026-10-18',
    eventTime: '04:00 PM – 08:30 PM',
    venue: 'GAT Central Auditorium, Rajarajeshwari Nagar',
    departmentId: 'cse-aiml',
    departmentName: 'Computer Science and Engineering (AI & ML)',
    registrationLink: 'https://gat.ac.in/',
    registrationDeadline: '2026-10-14',
    status: 'completed',
    authorId: 'sample-admin',
    authorName: 'Cultural Committee (Sample)',
    isSample: true,
    createdAt: new Date(now - 15 * dayMs),
    updatedAt: new Date(now - 15 * dayMs),
  },
];
