export interface Employee {
  _id: string;
  orgId: string;
  name: string;
  data: {
    owner: string;
    creation: string;
    modified: string;
    modified_by: string;
    customer_name: string;
    customer_type: string;
    language: string;
  };
  createdAt: string;
  updatedAt: string;
  firstSeen: number;
  lastSeen: number;
}

export const mockEmployees: Employee[] = [
  {
    _id: "EMP0001",
    orgId: "ORG001",
    name: "Nguyen Van A",
    data: {
      owner: "admin",
      creation: "2024-01-01T00:00:00Z",
      modified: "2024-01-01T00:00:00Z",
      modified_by: "admin",
      customer_name: "Nguyen Van A",
      customer_type: "Full-time",
      language: "en"
    },
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    firstSeen: Date.now() - 86400000, // 1 day ago
    lastSeen: Date.now()
  },
  {
    _id: "EMP0002",
    orgId: "ORG001",
    name: "Tran Thi B",
    data: {
      owner: "admin",
      creation: "2024-01-02T00:00:00Z",
      modified: "2024-01-02T00:00:00Z",
      modified_by: "admin",
      customer_name: "Tran Thi B",
      customer_type: "Part-time",
      language: "vi"
    },
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-02T00:00:00Z",
    firstSeen: Date.now() - 172800000, // 2 days ago
    lastSeen: Date.now() - 86400000 // 1 day ago
  },
  {
    _id: "EMP0003",
    orgId: "ORG001",
    name: "Le Hoang C",
    data: {
      owner: "admin",
      creation: "2024-01-03T00:00:00Z",
      modified: "2024-01-03T00:00:00Z",
      modified_by: "admin",
      customer_name: "Le Hoang C",
      customer_type: "Contract",
      language: "en"
    },
    createdAt: "2024-01-03T00:00:00Z",
    updatedAt: "2024-01-03T00:00:00Z",
    firstSeen: Date.now() - 259200000, // 3 days ago
    lastSeen: Date.now() - 172800000 // 2 days ago
  },
  {
    _id: "EMP0004",
    orgId: "ORG001",
    name: "Pham Thi D",
    data: {
      owner: "admin",
      creation: "2024-01-04T00:00:00Z",
      modified: "2024-01-04T00:00:00Z",
      modified_by: "admin",
      customer_name: "Pham Thi D",
      customer_type: "Intern",
      language: "vi"
    },
    createdAt: "2024-01-04T00:00:00Z",
    updatedAt: "2024-01-04T00:00:00Z",
    firstSeen: Date.now() - 345600000, // 4 days ago
    lastSeen: Date.now() - 259200000 // 3 days ago
  }
];
