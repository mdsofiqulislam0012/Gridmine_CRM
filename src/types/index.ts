export type ID = number | string;

export interface StatItem {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "danger" | "warning" | "info";
}

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  width?: string;
}

export interface Customer {
  id: string | number; company: string; contact: string; email: string; phone: string;
  active: boolean; group: string; dateCreated: string;
}

export interface Project {
  id: number; name: string; customer: string; tags: string[]; startDate: string;
  deadline: string; members: string[]; status: "Not Started" | "In Progress" | "On Hold" | "Cancelled" | "Finished";
  deliveredWork: string; workingFile: string; profitShare: string;
}

export interface Task {
  id: string | number; name: string; project: string; status: "Not Started" | "In Progress" | "Testing" | "Awaiting Feedback" | "Complete";
  startDate: string; dueDate: string; assignedTo: string; assignedToId?: string; tags: string[]; priority: "Low" | "Medium" | "High";
}

export interface Lead {
  id: number; name: string; company: string; email: string; phone: string; value: string;
  tags: string[]; assigned: string; status: string; source: string; lastContact: string; created: string; fiverrUrl: string;
}

export interface Ticket {
  id: number; subject: string; tags: string[]; department: string; service: string; contact: string;
  status: "Open" | "In Progress" | "Answered" | "On Hold" | "Closed"; priority: "Low" | "Medium" | "High"; lastReply: string; created: string;
}

export interface Invoice {
  id: string; customer: string; amount: string; tax: string; date: string; dueDate: string;
  status: "Draft" | "Not Sent" | "Unpaid" | "Partially Paid" | "Overdue" | "Paid";
}

export interface Estimate {
  id: string; customer: string; amount: string; date: string; expiryDate: string;
  status: "Draft" | "Not Sent" | "Sent" | "Expired" | "Declined" | "Accepted";
}

export interface Proposal {
  id: string; subject: string; customer: string; total: string; date: string; openTill: string;
  status: "Draft" | "Sent" | "Open" | "Revised" | "Declined" | "Accepted";
}

export interface Payment {
  id: string; invoiceId: string; mode: string; transactionId: string; customer: string; amount: string; date: string;
}

export interface Item {
  id: number; description: string; longDescription: string; rate: string; tax: string; unit: string;
}

export interface Subscription {
  id: number; name: string; customer: string; project: string; status: string;
  nextBilling: string; dateSubscribed: string; lastSent: string;
}

export interface Article {
  id: number; name: string; group: string; datePublished: string;
}
