export type Job = {
  id: string;
  title: string;
  company: string;
  category: string;
  location: string;
  salary: string;
  type: string;
  status: "pending" | "approved" | "rejected";
  description: string;
  requirements?: string;
  applicants: number;
  image?: string;
  datePosted: string;
};

export type User = {
  id: number;
  name: string;
  email: string;
  status: "active" | "suspended";
  appliedJobs: string[];
};

export type Applicant = {
  id: number;
  name: string;
  email: string;
  appliedFor: string;
  skills: string[];
  submittedAt: string;
  status: "pending" | "shortlisted" | "rejected";
  gender: string;
  age: number;
  hasPiercing: boolean;
  hasTattoo: boolean;
  resume?: string;
};

export const mockJobs: Job[] = [
  {
    id: "1",
    title: "Janitorial Staff",
    company: "CleanPro Services",
    category: "Facility Maintenance",
    location: "Manila",
    salary: "₱15,000 - ₱18,000",
    type: "Full-Time",
    status: "approved",
    description:
      "Maintain cleanliness and hygiene in office and public spaces.",
    requirements: "Must be physically fit and detail-oriented.",
    applicants: 3,
    image: "/images/janitorial.jpg",
    datePosted: "2025-10-10",
  },
  {
    id: "2",
    title: "Housekeeping Staff",
    company: "Luxe Hotel",
    category: "Hospitality",
    location: "Makati",
    salary: "₱17,000 - ₱20,000",
    type: "Full-Time",
    status: "approved",
    description: "Responsible for guest room and facility cleanliness.",
    requirements: "Experience in hotel housekeeping preferred.",
    applicants: 2,
    image: "/images/housekeeping.jpg",
    datePosted: "2025-10-09",
  },
  {
    id: "3",
    title: "Production Operator",
    company: "FlexWorks Inc.",
    category: "Manufacturing",
    location: "Cavite",
    salary: "₱14,000 - ₱16,000",
    type: "Full-Time",
    status: "approved",
    description: "Operate machinery and maintain production line efficiency.",
    requirements: "Familiarity with safety protocols and factory machinery.",
    applicants: 1,
    image: "/images/production.jpg",
    datePosted: "2025-10-08",
  },
  {
    id: "4",
    title: "Clerical Assistant",
    company: "PaperTrail Corp.",
    category: "Administrative Support",
    location: "Quezon City",
    salary: "₱16,000 - ₱18,000",
    type: "Full-Time",
    status: "approved",
    description:
      "Assist with clerical and documentation tasks in office operations.",
    requirements:
      "Proficient in MS Office and excellent organizational skills.",
    applicants: 1,
    image: "/images/clerical.jpg",
    datePosted: "2025-10-07",
  },
];

export const mockUsers: User[] = [
  {
    id: 1,
    name: "Mark Santos",
    email: "mark.santos@example.com",
    status: "active",
    appliedJobs: ["Housekeeping Staff", "Janitorial Staff"],
  },
  {
    id: 2,
    name: "Maria Lopez",
    email: "maria.lopez@example.com",
    status: "active",
    appliedJobs: ["Production Operator"],
  },
  {
    id: 3,
    name: "Juan Dela Cruz",
    email: "juan.delacruz@example.com",
    status: "suspended",
    appliedJobs: ["Clerical Assistant"],
  },
  {
    id: 4,
    name: "Lara Mendoza",
    email: "lara.mendoza@example.com",
    status: "active",
    appliedJobs: ["Janitorial Staff"],
  },
  {
    id: 5,
    name: "Alex Ramos",
    email: "alex.ramos@example.com",
    status: "active",
    appliedJobs: [],
  },
];

export const mockApplicants: Applicant[] = [
  {
    id: 1,
    name: "John Perez",
    email: "john.perez@example.com",
    appliedFor: "Production Operator",
    skills: ["Machinery Operation", "Maintenance", "Safety Compliance"],
    submittedAt: "2025-10-10",
    status: "pending",
    gender: "Male",
    age: 27,
    hasPiercing: false,
    hasTattoo: true,
    resume: "/resumes/johnperez.pdf",
  },
  {
    id: 2,
    name: "Ella Cruz",
    email: "ella.cruz@example.com",
    appliedFor: "Housekeeping Staff",
    skills: ["Housekeeping", "Attention to Detail", "Teamwork"],
    submittedAt: "2025-10-09",
    status: "shortlisted",
    gender: "Female",
    age: 25,
    hasPiercing: true,
    hasTattoo: false,
    resume: "/resumes/ellacruz.pdf",
  },
  {
    id: 3,
    name: "Ryan Dela Peña",
    email: "ryan.delapena@example.com",
    appliedFor: "Janitorial Staff",
    skills: ["Cleaning", "Organization", "Maintenance"],
    submittedAt: "2025-10-08",
    status: "pending",
    gender: "Male",
    age: 29,
    hasPiercing: false,
    hasTattoo: false,
  },
  {
    id: 4,
    name: "Grace Uy",
    email: "grace.uy@example.com",
    appliedFor: "Clerical Assistant",
    skills: ["Typing", "Filing", "Documentation"],
    submittedAt: "2025-10-07",
    status: "rejected",
    gender: "Female",
    age: 23,
    hasPiercing: false,
    hasTattoo: false,
  },
  {
    id: 5,
    name: "Paulo Dizon",
    email: "paulo.dizon@example.com",
    appliedFor: "Janitorial Staff",
    skills: ["Facility Cleaning", "Inventory Management", "Teamwork"],
    submittedAt: "2025-10-06",
    status: "pending",
    gender: "Male",
    age: 31,
    hasPiercing: false,
    hasTattoo: false,
  },
  {
    id: 6,
    name: "Hannah Bautista",
    email: "hannah.bautista@example.com",
    appliedFor: "Janitorial Staff",
    skills: ["Customer Service", "Room Sanitization", "Inventory Handling"],
    submittedAt: "2025-10-05",
    status: "shortlisted",
    gender: "Female",
    age: 28,
    hasPiercing: true,
    hasTattoo: false,
  },
  {
    id: 7,
    name: "Leo Fernando",
    email: "leo.fernando@example.com",
    appliedFor: "Janitorial Staff",
    skills: ["Welding", "Machine Calibration", "Quality Assurance"],
    submittedAt: "2025-10-04",
    status: "pending",
    gender: "Male",
    age: 30,
    hasPiercing: false,
    hasTattoo: true,
  },
  {
    id: 8,
    name: "Samantha Reyes",
    email: "samantha.reyes@example.com",
    appliedFor: "Clerical Assistant",
    skills: ["Data Entry", "Scheduling", "Records Filing"],
    submittedAt: "2025-10-03",
    status: "pending",
    gender: "Female",
    age: 26,
    hasPiercing: true,
    hasTattoo: false,
  },
  {
    id: 9,
    name: "Carlos Garcia",
    email: "carlos.garcia@example.com",
    appliedFor: "Production Operator",
    skills: ["Assembly Line Work", "Packaging", "Time Management"],
    submittedAt: "2025-10-02",
    status: "shortlisted",
    gender: "Male",
    age: 33,
    hasPiercing: false,
    hasTattoo: true,
  },
  {
    id: 10,
    name: "Nina Velasco",
    email: "nina.velasco@example.com",
    appliedFor: "Housekeeping Staff",
    skills: ["Laundry", "Room Setup", "Attention to Detail"],
    submittedAt: "2025-10-02",
    status: "rejected",
    gender: "Female",
    age: 24,
    hasPiercing: true,
    hasTattoo: false,
  },
  {
    id: 11,
    name: "Albert Tan",
    email: "albert.tan@example.com",
    appliedFor: "Clerical Assistant",
    skills: ["Typing", "Scheduling", "Communication"],
    submittedAt: "2025-10-01",
    status: "pending",
    gender: "Male",
    age: 22,
    hasPiercing: false,
    hasTattoo: false,
  },
  {
    id: 12,
    name: "Bea Lim",
    email: "bea.lim@example.com",
    appliedFor: "Janitorial Staff",
    skills: ["Mopping", "Trash Disposal", "Supply Restocking"],
    submittedAt: "2025-09-30",
    status: "pending",
    gender: "Female",
    age: 27,
    hasPiercing: false,
    hasTattoo: true,
  },
];

export const mockActivities = [
  "CleanPro Services posted a new Janitorial job",
  "Luxe Hotel requested additional Housekeeping staff",
  "New applicant registered: Ryan Dela Peña",
  "FlexWorks Inc. updated Production Operator requirements",
];

export const mockSummary = [
  { label: "Active Clients", value: "18" },
  { label: "Job Openings", value: "27" },
  { label: "Applicants in Process", value: "112" },
  { label: "Deployed Workers", value: "87" },
];

export const mockTopJobs = [
  { name: "Janitorial", value: 32 },
  { name: "Production", value: 45 },
  { name: "Housekeeping", value: 28 },
  { name: "Clerical", value: 21 },
  { name: "Hospitality", value: 37 },
  { name: "Utility", value: 19 },
  { name: "Gardening", value: 15 },
  { name: "Skilled & General Labor", value: 41 },
  { name: "Administrative & Office Support", value: 26 },
  { name: "Facility & Maintenance Services", value: 22 },
];

export const chartColors = [
  "#2563eb",
  "#16a34a", 
  "#eab308",
  "#ef4444", 
  "#8b5cf6", 
  "#06b6d4", 
  "#14b8a6", 
  "#6366f1",
  "#84cc16", 
];





export const mockTrend = [
  { label: "Jan", users: 60, jobs: 18 },
  { label: "Feb", users: 75, jobs: 21 },
  { label: "Mar", users: 85, jobs: 23 },
  { label: "Apr", users: 92, jobs: 26 },
  { label: "May", users: 110, jobs: 29 },
  { label: "Jun", users: 120, jobs: 30 },
  { label: "Jul", users: 132, jobs: 32 },
  { label: "Aug", users: 140, jobs: 35 },
];
