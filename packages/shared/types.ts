export type UserRole = "SUPERVISOR" | "AGENT";

export type LoanStatus =
  | "OVERDUE"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "PROMISED_TO_PAY"
  | "PARTIALLY_PAID"
  | "PAID"
  | "CLOSED";

export type LoanListItem = {
  id: string;
  loanNumber: string;
  status: LoanStatus;

  principalAmount: string;
  outstandingAmount: string;
  overdueAmount: string;

  monthlyInstallmentAmount: string;
  installmentDueDay: number;
  missedInstallmentCount: number;
  daysPastDue: number;
  nextInstallmentDate: string;
  delinquencyBucket: DelinquencyBucket;

  dueDate: string;

  customer: {
    id: string;
    businessName: string;
    contactPerson: string;
    phone: string;
  };

  product: {
    id: string;
    name: string;
  };
};

export type CollectionUpdateItem = {
  id: string;
  updateType: CollectionUpdateType;
  status: CollectionUpdateStatus;

  amountPaid: string | null;

  promisedPaymentDate: string | null;
  promisedAmount: string | null;
  followUpDate: string | null;

  remarks: string;
  createdAt: string;

  agent: {
    id: string;
    name: string;
  };
};

export type LoanDetail = LoanListItem & {
  assignment: {
    agentId: string;
    agentName: string;
    assignedAt: string;
  } | null;

  updates: CollectionUpdateItem[];
};

export type DelinquencyBucket =
  | "CURRENT"
  | "DPD_1_30"
  | "DPD_31_60"
  | "DPD_61_90"
  | "DPD_90_PLUS"
  | "LEGAL_REVIEW";

export type CollectionUpdateType = "CALL" | "VISIT" | "PAYMENT" | "NOTE";

export type CollectionUpdateStatus =
  | "CONTACTED"
  | "VISITED"
  | "PROMISED_TO_PAY"
  | "PARTIAL_PAYMENT"
  | "PAID"
  | "UNREACHABLE"
  | "FOLLOW_UP_REQUIRED";

export type ProductItem = {
  id: string;
  name: string;
  description: string | null;
};

export type ProductDetail = ProductItem & {
  createdAt: string;
  updatedAt: string;
};

export type AgentItem = {
  id: string;
  name: string;
  email: string;
};

export type AgentDetail = AgentItem & {
  summary: {
    activeAssignments: number;
    totalCollected: string;
    promisedToPayCount: number;
    followUpsDue: number;
  };

  assignedLoans: LoanListItem[];

  recentUpdates: CollectionUpdateItem[];
};

export type AssignLoanRequest = {
  loanId: string;
  agentId: string;
};

export type AssignmentResult = {
  id: string;
  loanId: string;
  agentId: string;
  assignedById: string;
  assignedAt: string;
};

export type CreateCollectionUpdateRequest = {
  updateType: CollectionUpdateType;
  status: CollectionUpdateStatus;
  amountPaid?: string | null;
  promisedPaymentDate?: string | null;
  promisedAmount?: string | null;
  followUpDate?: string | null;
  remarks: string;
};

export type AuditSeverity = "INFO" | "WARNING" | "SECURITY";

export type AuditAction =
  | "LOGIN"
  | "LOGOUT"
  | "ASSIGNED_LOAN"
  | "UNASSIGNED_LOAN"
  | "CREATED_COLLECTION_UPDATE"
  | "UPDATED_LOAN_STATUS"
  | "CREATED_CUSTOMER"
  | "CREATED_LOAN"
  | "VIEWED_LOAN"
  | "VIEWED_AGENT"
  | "FAILED_LOGIN";

export type AuditEntityType =
  | "USER"
  | "LOAN"
  | "CUSTOMER"
  | "ASSIGNMENT"
  | "COLLECTION_UPDATE"
  | "PRODUCT";

export type AuditItem = {
  id: string;
  action: AuditAction;
  severity: AuditSeverity;
  entityType: AuditEntityType;
  entityId: string;
  metadata: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  actor: {
    id: string;
    name: string;
    email: string;
  };
};

export type DashboardSummary = {
  totalLoans: number;
  activeAssignments: number;

  totalOutstandingAmount: string;
  totalOverdueAmount: string;
  totalCollectedAmount: string;

  promisedToPayCount: number;
  followUpsDue: number;

  loansByStatus: {
    status: LoanStatus;
    count: number;
  }[];

  loansByDelinquencyBucket: {
    bucket: DelinquencyBucket;
    count: number;
  }[];
};

export type LoanAssignedEventPayload = {
  loanId: string;
  agentId: string;
  assignedById: string;
};

export type CollectionUpdateCreatedEventPayload = {
  loanId: string;
  updateId: string;
  agentId: string;
};

export type NotificationType =
  | "LOAN_ASSIGNED"
  | "COLLECTION_UPDATE_CREATED"
  | "FOLLOW_UP_DUE";

export type NotificationItem = {
  id: string;
  userId: string;
  type: NotificationType;

  title: string;
  message: string;
  metadata: unknown;

  readAt: string | null;
  createdAt: string;
};

export type NotificationCreatedEvent = {
  type: "NOTIFICATION_CREATED";
  payload: {
    notification: NotificationItem;
  };
  createdAt: string;
};

export type RealtimeEvent = NotificationCreatedEvent;

export type ApiError = {
  code: number;
  message: string;
  detail?: string;
};

export type ApiMeta = {
  requestId: string;
  timestamp: string;
};

export type ApiResponse<T> = {
  data?: T;
  error?: ApiError;
  meta: ApiMeta;
};
