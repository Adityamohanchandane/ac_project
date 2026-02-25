// Static mock data for Netlify deployment
export const mockUsers = [
  {
    id: "83ad4a45-0cc5-4c3c-8bc6-c2edc71f75bc",
    email: "adii123@gmail.com",
    password: "$2b$10$Xt7Wtiq5zXHCnGxEu8XCReNuMolsWfM2ifre9z7rrIKbShcQ27tg2",
    role: "police",
    full_name: "Police Officer",
    mobile: "1234567890",
    address: "Police Station",
    created_at: "2026-02-25T13:12:10.532Z"
  },
  {
    id: "f1fd51b8-754f-40fc-a247-ec468176df97",
    email: "test@example.com",
    password: "d74ff0ee8da3b9806b18c877dbf29bbde50b5bd8e4dad7a3a725000feb82e8f1",
    role: "user",
    full_name: "Test User",
    mobile: "1234567890",
    address: "Test Address",
    created_at: "2026-02-25T07:44:47.712Z"
  }
];

export const mockComplaints = [
  {
    id: "8029aaf5-c6c2-450f-ac23-e2c189db0627",
    complaint_id: "CMP1772011370555",
    user_id: "f1fd51b8-754f-40fc-a247-ec468176df97",
    user_email: "test@example.com",
    title: "Street Light Not Working",
    category: "Infrastructure",
    description: "Street light has been not working for past 3 days near main road",
    incident_date: "2026-02-25",
    status: "pending",
    priority_level: "normal",
    created_at: "2026-02-25T13:12:10.532Z",
    updated_at: "2026-02-25T13:12:10.532Z"
  },
  {
    id: "eb21552e-c965-4b0d-831d-c04f9b90e362",
    complaint_id: "CMP1772024405328",
    user_id: "f1fd51b8-754f-40fc-a247-ec468176df97",
    user_email: "test@example.com",
    title: "Noise Pollution",
    category: "Environmental",
    description: "Loud noise from construction site during late hours",
    incident_date: "2026-02-25",
    status: "investigating",
    priority_level: "high",
    created_at: "2026-02-25T14:15:30.123Z",
    updated_at: "2026-02-25T15:30:45.456Z"
  }
];
