import type {
  AgentDetail,
  AgentItem,
  ApiResponse,
  AssignLoanRequest,
  AssignmentResult,
  AuditItem,
  CollectionUpdateItem,
  CreateCollectionUpdateRequest,
  DashboardSummary,
  DelinquencyBucket,
  LoanDetail,
  LoanListItem,
  LoanStatus,
  NotificationItem,
  ProductDetail,
  ProductItem,
  RealtimeEvent,
} from "@collecta/shared/types";

export type LoginRequest = {
  email: string;
  password: string;
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPERVISOR" | "AGENT";
};

export type LoginResponse = {
  user: SessionUser;
};

export type LoansQuery = {
  search?: string;
  status?: LoanStatus;
  delinquencyBucket?: DelinquencyBucket;
  agentId?: string;
  page?: number;
  limit?: number;
};

export type NotificationsQuery = {
  status?: "unread";
};

export type MarkNotificationsReadResponse = {
  updatedCount: number;
  notifications: NotificationItem[];
};

export type CollectaClientOptions = {
  baseUrl?: string;
  fetcher?: typeof fetch;
};

export const COLLECTA_UNAUTHORIZED_EVENT = "collecta:unauthorized";
export const COLLECTA_AUTH_CHANGED_EVENT = "collecta:auth-changed";

export function dispatchUnauthorized(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(COLLECTA_UNAUTHORIZED_EVENT));
}

function dispatchAuthChanged(): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(COLLECTA_AUTH_CHANGED_EVENT));
}

export class CollectaClientError extends Error {
  constructor(
    public code: number,
    message: string,
    public detail?: string,
    public status?: number,
    public requestId?: string,
  ) {
    super(message, {
      cause: detail,
    });
    this.name = "CollectaClientError";
  }
}

export class CollectaClient {
  private readonly baseUrl: string;
  private readonly fetcher: typeof fetch;

  constructor(options: CollectaClientOptions = {}) {
    this.baseUrl =
      options.baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? "/api/v1";
    this.fetcher = options.fetcher ?? globalThis.fetch.bind(globalThis);
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
  ): Promise<T> {
    const response = await this.fetcher(`${this.baseUrl}${path}`, {
      ...options,
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });

    let json: ApiResponse<T>;

    try {
      json = (await response.json()) as ApiResponse<T>;
    } catch {
      if (response.status === 401) {
        dispatchUnauthorized();
      }

      if (response.status === 403) {
        dispatchAuthChanged();
      }

      throw new CollectaClientError(
        response.status,
        "Invalid Api response",
        undefined,
        response.status,
      );
    }

    if (!response.ok || json.error) {
      if (response.status === 401) {
        dispatchUnauthorized();
      }

      if (response.status === 403) {
        dispatchAuthChanged();
      }

      throw new CollectaClientError(
        json.error?.code ?? response.status,
        json.error?.message ?? "Request failed",
        json.error?.detail,
        response.status,
        json.meta.requestId,
      );
    }

    console.log(`collecta: request id ${json.meta.requestId}`);
    console.log(`collecta: timestamp ${json.meta.timestamp}`);

    return json.data as T;
  }

  private query(path: string, params: Record<string, unknown>): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, String(value));
      }
    }

    const queryString = search.toString();
    return queryString ? `${path}?${queryString}` : path;
  }

  login(body: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  logout(): Promise<void> {
    return this.request<void>("/auth/logout", {
      method: "POST",
    });
  }

  me(options: RequestInit = {}): Promise<SessionUser> {
    return this.request<SessionUser>("/auth/me", options);
  }

  getDashboardSummary(): Promise<DashboardSummary> {
    return this.request<DashboardSummary>("/dashboard");
  }

  getProducts(): Promise<ProductItem[]> {
    return this.request<ProductItem[]>("/products");
  }

  getProduct(id: string): Promise<ProductDetail> {
    return this.request<ProductDetail>(`/products/${id}`);
  }

  getLoans(query: LoansQuery = {}): Promise<LoanListItem[]> {
    return this.request<LoanListItem[]>(this.query("/loans", query));
  }

  getLoan(id: string): Promise<LoanDetail> {
    return this.request<LoanDetail>(`/loans/${id}`);
  }

  assignLoan(body: AssignLoanRequest): Promise<AssignmentResult> {
    return this.request<AssignmentResult>("/assignments", {
      method: "POST",

      body: JSON.stringify(body),
    });
  }

  addCollectionUpdate(
    loanId: string,
    body: CreateCollectionUpdateRequest,
  ): Promise<CollectionUpdateItem> {
    return this.request<CollectionUpdateItem>(
      `/loans/${loanId}/updates`,

      {
        method: "POST",

        body: JSON.stringify(body),
      },
    );
  }

  getAgents(): Promise<AgentItem[]> {
    return this.request<AgentItem[]>("/agents");
  }

  getAgent(id: string): Promise<AgentDetail> {
    return this.request<AgentDetail>(`/agents/${id}`);
  }

  getAuditLogs(): Promise<AuditItem[]> {
    return this.request<AuditItem[]>("/audit");
  }

  getNotifications(
    query: NotificationsQuery = {},
  ): Promise<NotificationItem[]> {
    return this.request<NotificationItem[]>(
      this.query("/notifications", query),
    );
  }

  markNotificationRead(id: string): Promise<NotificationItem | null> {
    return this.request<NotificationItem | null>(`/notifications/${id}/read`, {
      method: "POST",
    });
  }

  markAllNotificationsRead(): Promise<MarkNotificationsReadResponse> {
    return this.request<MarkNotificationsReadResponse>("/notifications/read", {
      method: "POST",
    });
  }

  createEventSource(path = "/events"): EventSource {
    return new EventSource(`${this.baseUrl}${path}`, {
      withCredentials: true,
    });
  }

  subscribeToEvents(
    onEvent: (event: RealtimeEvent) => void,
    onError?: (event: Event) => void,
  ): EventSource {
    const source = this.createEventSource();

    source.addEventListener("NOTIFICATION_CREATED", (event) => {
      onEvent(JSON.parse((event as MessageEvent).data) as RealtimeEvent);
    });

    if (onError) {
      source.onerror = onError;
    }

    return source;
  }
}

export const collecta = new CollectaClient();
