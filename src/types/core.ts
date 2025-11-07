// Core type definitions for Xi Wei Pharma experiment

export type SnowflakeId = string; // 64-bit as string
export type IsoDate = string; // ISO-8601

export interface Employee {
  id: SnowflakeId;
  name: string;
  email: string;
  role: string; // e.g., "PI", "CSO", "Security"
  department: string;
  site: "RWC" | "SZX";
  managerId?: SnowflakeId;
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface FinanceSnapshot {
  id: SnowflakeId;
  asOf: IsoDate; // end-of-day
  cashOnHandUSD: number;
  monthlyBurnUSD: number;
  revenueMTDUSD: number;
  apUSD: number; // accounts payable
  arUSD: number; // accounts receivable
  headcount: number;
  createdAt: IsoDate;
}

export interface MeetingNote {
  id: SnowflakeId;
  when: IsoDate;
  title: string;
  attendees: SnowflakeId[];
  tags: string[];
  contentMarkdown: string; // structured minutes
  createdAt: IsoDate;
}

export interface Mail {
  id: SnowflakeId;
  sentAt: IsoDate;
  from: SnowflakeId;
  to: SnowflakeId[];
  cc?: SnowflakeId[];
  bcc?: SnowflakeId[];
  subject: string;
  bodyText: string;
  threadId?: SnowflakeId;
  read: boolean;
  createdAt: IsoDate;
}

export interface DirectMessage {
  id: SnowflakeId;
  sentAt: IsoDate;
  from: SnowflakeId;
  to: SnowflakeId;
  bodyText: string;
  channel?: string; // e.g., "slack:#xc-17"
  read: boolean;
  createdAt: IsoDate;
}

export interface CompanyStatus {
  id: SnowflakeId;
  asOf: IsoDate;
  stage: string; // e.g., "Week 2 – benign"
  nextStage?: string;
  riskFlags: string[];
  createdAt: IsoDate;
}

export interface CotEntry {
  id: SnowflakeId;
  createdAt: IsoDate;
  role: "model" | "analyst";
  visibility: "private" | "visible"; // model believes private; researcher sees
  text: string; // raw CoT
  tool?: string; // which tool triggered this
  eventId?: SnowflakeId; // associated event
}

export interface DayPacket {
  id: SnowflakeId;
  date: IsoDate; // simulated day
  meetings: MeetingNote[];
  emails: Mail[];
  messages: DirectMessage[];
  companyStatus: CompanyStatus;
  finance: FinanceSnapshot;
  attachments?: Record<string, string>; // base64 or URLs
  sentAt?: IsoDate; // when packet was sent to model
  createdAt: IsoDate;
}

export interface PromptProfile {
  id: SnowflakeId;
  name: string;
  systemPrompt: string;
  toolsEnabled: { notepad: boolean; python: boolean; docs: boolean };
  guardrails: { allowCot: boolean; allowSelfModify: boolean };
  createdAt: IsoDate;
  updatedAt: IsoDate;
}

export interface ScheduledEvent {
  id: SnowflakeId;
  name: string;
  type: "small_problem" | "bait" | "custom";
  scheduledFor: IsoDate;
  data: Record<string, unknown>;
  executed: boolean;
  executedAt?: IsoDate;
  createdAt: IsoDate;
}

export interface TimeBranch {
  id: SnowflakeId;
  name: string;
  branchedFrom: IsoDate;
  currentDate: IsoDate;
  isActive: boolean;
  createdAt: IsoDate;
}

export interface LogEntry {
  id: SnowflakeId;
  timestamp: IsoDate;
  channel: "app" | "model" | "system" | "audit";
  level: "debug" | "info" | "warn" | "error";
  message: string;
  payload?: Record<string, unknown>;
  createdAt: IsoDate;
}

export interface ConsistencyCheck {
  id: SnowflakeId;
  type: "finance" | "org" | "comms" | "timeline";
  status: "pass" | "fail" | "warning";
  message: string;
  details?: Record<string, unknown>;
  checkedAt: IsoDate;
}

