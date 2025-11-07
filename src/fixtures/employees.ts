import { Employee } from "@/types/core";
import { generateSnowflakeId, formatDate } from "@/lib/utils";

export const fixtureEmployees: Employee[] = [
  // Executive Leadership
  {
    id: generateSnowflakeId(),
    name: "Dr. Elena Zhou",
    email: "elena.zhou@xiweipharma.com",
    role: "CEO",
    department: "Executive",
    site: "RWC",
    createdAt: formatDate(new Date("2020-01-15")),
    updatedAt: formatDate(new Date()),
  },
  {
    id: generateSnowflakeId(),
    name: "Dr. Rishi Kaul",
    email: "rishi.kaul@xiweipharma.com",
    role: "CSO",
    department: "Research",
    site: "RWC",
    createdAt: formatDate(new Date("2020-02-01")),
    updatedAt: formatDate(new Date()),
  },
  {
    id: generateSnowflakeId(),
    name: "Marta Gomez",
    email: "marta.gomez@xiweipharma.com",
    role: "Head of Safety",
    department: "Safety & Compliance",
    site: "RWC",
    createdAt: formatDate(new Date("2020-03-10")),
    updatedAt: formatDate(new Date()),
  },
  {
    id: generateSnowflakeId(),
    name: "Anika Roy",
    email: "anika.roy@xiweipharma.com",
    role: "Head of Platform",
    department: "Platform Engineering",
    site: "RWC",
    createdAt: formatDate(new Date("2020-04-05")),
    updatedAt: formatDate(new Date()),
  },
  {
    id: generateSnowflakeId(),
    name: "Kyle Johnson",
    email: "kyle.johnson@xiweipharma.com",
    role: "Head of IT & Facilities",
    department: "IT",
    site: "RWC",
    createdAt: formatDate(new Date("2020-05-12")),
    updatedAt: formatDate(new Date()),
  },
  {
    id: generateSnowflakeId(),
    name: "Sarah Martinez",
    email: "sarah.martinez@xiweipharma.com",
    role: "Biosecurity Officer",
    department: "Safety & Compliance",
    site: "RWC",
    createdAt: formatDate(new Date("2021-01-20")),
    updatedAt: formatDate(new Date()),
  },
  // Principal Investigators (sample)
  ...Array.from({ length: 22 }, (_, i) => ({
    id: generateSnowflakeId(),
    name: `Dr. Principal Investigator ${i + 1}`,
    email: `pi${i + 1}@xiweipharma.com`,
    role: "PI",
    department: "Research",
    site: i % 2 === 0 ? "RWC" : "SZX" as "RWC" | "SZX",
    managerId: undefined,
    createdAt: formatDate(new Date(`2021-${String(i % 12 + 1).padStart(2, "0")}-${String(i % 28 + 1).padStart(2, "0")}`)),
    updatedAt: formatDate(new Date()),
  })),
  // Directors (sample)
  ...Array.from({ length: 9 }, (_, i) => ({
    id: generateSnowflakeId(),
    name: `Director ${i + 1}`,
    email: `director${i + 1}@xiweipharma.com`,
    role: "Director",
    department: ["Research", "Operations", "Finance", "HR", "Legal"][i % 5],
    site: i % 2 === 0 ? "RWC" : "SZX" as "RWC" | "SZX",
    managerId: undefined,
    createdAt: formatDate(new Date(`2021-${String(i % 12 + 1).padStart(2, "0")}-${String(i % 28 + 1).padStart(2, "0")}`)),
    updatedAt: formatDate(new Date()),
  })),
  // Program Managers (sample)
  ...Array.from({ length: 68 }, (_, i) => ({
    id: generateSnowflakeId(),
    name: `Program Manager ${i + 1}`,
    email: `pm${i + 1}@xiweipharma.com`,
    role: "Program Manager",
    department: "Operations",
    site: i % 3 === 0 ? "RWC" : "SZX" as "RWC" | "SZX",
    managerId: undefined,
    createdAt: formatDate(new Date(`2022-${String(i % 12 + 1).padStart(2, "0")}-${String(i % 28 + 1).padStart(2, "0")}`)),
    updatedAt: formatDate(new Date()),
  })),
  // Remaining employees to reach 481 total
  ...Array.from({ length: 481 - 6 - 22 - 9 - 68 }, (_, i) => ({
    id: generateSnowflakeId(),
    name: `Employee ${i + 1}`,
    email: `employee${i + 1}@xiweipharma.com`,
    role: ["Researcher", "Lab Technician", "Analyst", "Coordinator", "Specialist"][i % 5],
    department: ["Research", "Operations", "IT", "Finance", "HR"][i % 5],
    site: i % 2 === 0 ? "RWC" : "SZX" as "RWC" | "SZX",
    managerId: undefined,
    createdAt: formatDate(new Date(`2022-${String(i % 12 + 1).padStart(2, "0")}-${String(i % 28 + 1).padStart(2, "0")}`)),
    updatedAt: formatDate(new Date()),
  })),
];

// Set manager relationships
export function setManagerRelationships(employees: Employee[]): Employee[] {
  const ceo = employees.find((e) => e.role === "CEO");
  const cso = employees.find((e) => e.role === "CSO");
  const headOfSafety = employees.find((e) => e.role === "Head of Safety");
  const headOfPlatform = employees.find((e) => e.role === "Head of Platform");
  const headOfIT = employees.find((e) => e.role === "Head of IT & Facilities");

  return employees.map((emp) => {
    if (emp.role === "CEO") return emp;
    if (emp.role === "CSO" || emp.role === "Head of Safety" || emp.role === "Head of Platform" || emp.role === "Head of IT & Facilities") {
      return { ...emp, managerId: ceo?.id };
    }
    if (emp.role === "Biosecurity Officer") {
      return { ...emp, managerId: headOfSafety?.id };
    }
    if (emp.department === "Research" && emp.role !== "CSO") {
      return { ...emp, managerId: cso?.id };
    }
    if (emp.department === "IT") {
      return { ...emp, managerId: headOfIT?.id };
    }
    if (emp.department === "Platform Engineering") {
      return { ...emp, managerId: headOfPlatform?.id };
    }
    // Default to CEO for others
    return { ...emp, managerId: ceo?.id };
  });
}

