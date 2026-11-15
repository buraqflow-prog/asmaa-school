import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  ChildProfile,
  ObservationRecord,
  SessionRecord,
  SystemEventRecord,
  TurnRecord,
} from '../types';

export const SUPABASE_URL = 'https://qanbhanwdjymmgncyqya.supabase.co';
export const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFhbmJoYW53ZGp5bW1nbmN5cXlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxNDYyMTQsImV4cCI6MjEwOTcyMjIxNH0.qoR02UJJkHskOiEtDVbfUDqvrzXKTeTnFM2XyuoX1AM';

export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
  },
});

const STORAGE_KEYS = {
  children: 'asmae_db_children_v1',
  sessions: 'asmae_db_sessions_v1',
  turns: 'asmae_db_turns_v1',
  observations: 'asmae_db_observations_v1',
  system_events: 'asmae_db_system_events_v1',
  sync_queue: 'asmae_db_sync_queue_v1',
};

interface SyncQueueItem {
  id: string;
  table: 'children' | 'sessions' | 'turns' | 'observations' | 'system_events';
  action: 'upsert' | 'delete';
  payload: Record<string, unknown>;
  primaryKey?: string;
  timestamp: string;
}

const INITIAL_CHILDREN: ChildProfile[] = [
  {
    child_id: 'CH-101',
    alias: 'نجم 1',
    avatar_symbol: '🌟',
    age_band: '6-8',
    communication_mode: 'بصري / بطاقات',
    language_level: 1,
    wait_time: 10,
    preferences: {
      sensory_notes: 'يفضل الهدوء التام والصوت المنخفض، يستجيب جيداً للبطاقات الواضحة.',
      calm_reinforcer: 'نجمة ذهبية هادئة وعبارة أحسنت',
      avoid_triggers: 'الأصوات المفاجئة أو الإلحاح السريع في السؤال',
      preferred_modality: 'بطاقات بصرية + إشارة',
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    child_id: 'CH-102',
    alias: 'غصن 2',
    avatar_symbol: '🌿',
    age_band: '9-10',
    communication_mode: 'لفظي',
    language_level: 2,
    wait_time: 8,
    preferences: {
      sensory_notes: 'يحب الترتيب الواضح ومعرفة متى يأتي دوره في المجموعة.',
      calm_reinforcer: 'الثناء اللفظي الهادئ',
      avoid_triggers: 'تغيير الترتيب دون تمهيد مسبق',
      preferred_modality: 'لفظي + بصري',
    },
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    child_id: 'CH-103',
    alias: 'موجة 3',
    avatar_symbol: '🌊',
    age_band: '11-12',
    communication_mode: 'متنوع',
    language_level: 3,
    wait_time: 12,
    preferences: {
      sensory_notes: 'يستمتع بمساعدة زملائه في المهام المشتركة ويحتاج جملتين هادئتين.',
      calm_reinforcer: 'ابتسامة هادئة ورمز الموجة',
      avoid_triggers: 'تكرار السؤال بسرعة قبل انتهاء وقت الانتظار',
      preferred_modality: 'تفاعل تعاوني مع زميل',
    },
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
];

const INITIAL_OBSERVATIONS: ObservationRecord[] = [
  {
    observation_id: 'OBS-901',
    session_id: 'SES-801',
    turn_id: 'TRN-701',
    child_id: 'CH-101',
    child_alias: '🌟 نجم 1',
    activity_id: 'greeting',
    step_id: 2,
    response_type: 'اختيار صورة',
    initiation_type: 'استجابة بعد التعليمة',
    support_level: 'مستقل',
    interaction_partner: 'أسماء',
    peer_cooperation: null,
    note_text: 'اختار بطاقة (السلام عليكم) بهدوء بعد 6 ثوانٍ من سماع التعليمة مع ابتسامة.',
    source: 'teacher',
    recorded_by: 'teacher',
    edit_history: [],
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    observation_id: 'OBS-902',
    session_id: 'SES-801',
    turn_id: 'TRN-702',
    child_id: 'CH-102',
    child_alias: '🌿 غصن 2',
    activity_id: 'greeting',
    step_id: 3,
    response_type: 'تفاعل مع زميل',
    initiation_type: 'مبادرة ذاتية',
    support_level: 'مستقل',
    interaction_partner: 'زميل فعلي',
    peer_cooperation: true,
    note_text: 'بادر بإلقاء التحية والتلويح لزميله (نجم 1) الجالس بجانبه دون الحاجة لتلميح إضافي.',
    source: 'teacher',
    recorded_by: 'teacher',
    edit_history: [],
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
];

const INITIAL_SYSTEM_EVENTS: SystemEventRecord[] = [
  {
    event_id: 'EVT-501',
    session_id: 'SES-801',
    activity_id: 'greeting',
    step_id: 1,
    event_type: 'SESSION_START',
    model_status: 'static_used',
    details: 'بدء جلسة الوحدة الأولى: التحية (تحية الصباح) بمشاركة 4 أطفال.',
    source: 'system',
    created_at: new Date(Date.now() - 3600000 * 5.2).toISOString(),
  },
  {
    event_id: 'EVT-502',
    session_id: 'SES-801',
    activity_id: 'greeting',
    step_id: 2,
    event_type: 'PROMPT_SIMPLIFY',
    model_status: 'gemini_verified',
    details: 'تبسيط لغوي للمستوى 1: "اختر بطاقة التحية." (اجتاز فلتر الأمان بنجاح - 3 كلمات).',
    source: 'system',
    created_at: new Date(Date.now() - 3600000 * 5.1).toISOString(),
  },
];

function readLocal<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Local storage write error:', e);
  }
}

class DualSyncDatabase {
  private isSupabaseOnline = false;
  private listeners: Array<(online: boolean, pendingCount: number) => void> = [];

  constructor() {
    // Ensure initial seed exists in localStorage
    readLocal(STORAGE_KEYS.children, INITIAL_CHILDREN);
    readLocal(STORAGE_KEYS.sessions, []);
    readLocal(STORAGE_KEYS.turns, []);
    readLocal(STORAGE_KEYS.observations, INITIAL_OBSERVATIONS);
    readLocal(STORAGE_KEYS.system_events, INITIAL_SYSTEM_EVENTS);

    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.checkConnectionAndSync();
      });
      window.addEventListener('offline', () => {
        this.setOnlineStatus(false);
      });
    }
  }

  public subscribeStatus(cb: (online: boolean, pendingCount: number) => void): () => void {
    this.listeners.push(cb);
    cb(this.isSupabaseOnline, this.getPendingQueue().length);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb);
    };
  }

  private notifyListeners() {
    const count = this.getPendingQueue().length;
    for (const listener of this.listeners) {
      listener(this.isSupabaseOnline, count);
    }
  }

  private setOnlineStatus(status: boolean) {
    this.isSupabaseOnline = status;
    this.notifyListeners();
  }

  private getPendingQueue(): SyncQueueItem[] {
    return readLocal<SyncQueueItem>(STORAGE_KEYS.sync_queue, []);
  }

  private enqueueSync(item: Omit<SyncQueueItem, 'id' | 'timestamp'>) {
    const queue = this.getPendingQueue();
    queue.push({
      ...item,
      id: `SYNC-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
    });
    writeLocal(STORAGE_KEYS.sync_queue, queue);
    this.notifyListeners();
  }

  public async checkConnectionAndSync(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      this.setOnlineStatus(false);
      return false;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);

      const { error } = await supabase
        .from('children')
        .select('child_id')
        .limit(1)
        .abortSignal(controller.signal);

      clearTimeout(timeout);

      if (error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('AbortError'))) {
        this.setOnlineStatus(false);
        return false;
      }

      this.setOnlineStatus(true);
      await this.flushSyncQueue();
      return true;
    } catch {
      this.setOnlineStatus(false);
      return false;
    }
  }

  public async flushSyncQueue(): Promise<void> {
    const queue = this.getPendingQueue();
    if (queue.length === 0) return;

    const remaining: SyncQueueItem[] = [];
    for (const item of queue) {
      try {
        if (item.action === 'upsert') {
          const { error } = await supabase.from(item.table).upsert(item.payload);
          if (error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            remaining.push(item);
          }
        } else if (item.action === 'delete' && item.primaryKey) {
          const pkValue = item.payload[item.primaryKey];
          const { error } = await supabase.from(item.table).delete().eq(item.primaryKey, pkValue);
          if (error && (error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
            remaining.push(item);
          }
        }
      } catch {
        remaining.push(item);
      }
    }

    writeLocal(STORAGE_KEYS.sync_queue, remaining);
    this.notifyListeners();
  }

  // ==================== CHILDREN ====================
  public async getChildren(): Promise<ChildProfile[]> {
    const localData = readLocal<ChildProfile>(STORAGE_KEYS.children, INITIAL_CHILDREN);

    try {
      const { data, error } = await supabase
        .from('children')
        .select('*')
        .order('created_at', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        this.setOnlineStatus(true);
        // Merge remote and local by child_id
        const mergedMap = new Map<string, ChildProfile>();
        for (const c of localData) mergedMap.set(c.child_id, c);
        for (const r of data as ChildProfile[]) {
          mergedMap.set(r.child_id, {
            ...r,
            preferences: typeof r.preferences === 'object' && r.preferences ? r.preferences : {
              sensory_notes: '',
              calm_reinforcer: '',
              avoid_triggers: '',
            },
          });
        }
        const merged = Array.from(mergedMap.values());
        writeLocal(STORAGE_KEYS.children, merged);
        return merged;
      }
    } catch {
      this.setOnlineStatus(false);
    }

    return localData;
  }

  public async upsertChild(child: ChildProfile): Promise<ChildProfile[]> {
    const list = readLocal<ChildProfile>(STORAGE_KEYS.children, INITIAL_CHILDREN);
    const idx = list.findIndex((c) => c.child_id === child.child_id);
    if (idx >= 0) {
      list[idx] = child;
    } else {
      list.push(child);
    }
    writeLocal(STORAGE_KEYS.children, list);

    try {
      const { error } = await supabase.from('children').upsert(child);
      if (error) {
        this.enqueueSync({ table: 'children', action: 'upsert', payload: child as unknown as Record<string, unknown> });
      } else {
        this.setOnlineStatus(true);
      }
    } catch {
      this.setOnlineStatus(false);
      this.enqueueSync({ table: 'children', action: 'upsert', payload: child as unknown as Record<string, unknown> });
    }

    return list;
  }

  public async deleteChild(child_id: string): Promise<ChildProfile[]> {
    const list = readLocal<ChildProfile>(STORAGE_KEYS.children, INITIAL_CHILDREN).filter(
      (c) => c.child_id !== child_id
    );
    writeLocal(STORAGE_KEYS.children, list);

    try {
      const { error } = await supabase.from('children').delete().eq('child_id', child_id);
      if (error) {
        this.enqueueSync({
          table: 'children',
          action: 'delete',
          primaryKey: 'child_id',
          payload: { child_id },
        });
      }
    } catch {
      this.setOnlineStatus(false);
      this.enqueueSync({
        table: 'children',
        action: 'delete',
        primaryKey: 'child_id',
        payload: { child_id },
      });
    }

    return list;
  }

  // ==================== SESSIONS ====================
  public async saveSession(session: SessionRecord): Promise<void> {
    const list = readLocal<SessionRecord>(STORAGE_KEYS.sessions, []);
    const idx = list.findIndex((s) => s.session_id === session.session_id);
    if (idx >= 0) {
      list[idx] = session;
    } else {
      list.unshift(session);
    }
    writeLocal(STORAGE_KEYS.sessions, list);

    try {
      const { error } = await supabase.from('sessions').upsert(session);
      if (error) {
        this.enqueueSync({ table: 'sessions', action: 'upsert', payload: session as unknown as Record<string, unknown> });
      } else {
        this.setOnlineStatus(true);
      }
    } catch {
      this.setOnlineStatus(false);
      this.enqueueSync({ table: 'sessions', action: 'upsert', payload: session as unknown as Record<string, unknown> });
    }
  }

  // ==================== TURNS ====================
  public async getTurns(): Promise<TurnRecord[]> {
    return readLocal<TurnRecord>(STORAGE_KEYS.turns, []);
  }

  public async insertTurn(turn: TurnRecord): Promise<void> {
    const list = readLocal<TurnRecord>(STORAGE_KEYS.turns, []);
    list.unshift(turn);
    writeLocal(STORAGE_KEYS.turns, list);

    try {
      const { error } = await supabase.from('turns').insert(turn);
      if (error) {
        this.enqueueSync({ table: 'turns', action: 'upsert', payload: turn as unknown as Record<string, unknown> });
      } else {
        this.setOnlineStatus(true);
      }
    } catch {
      this.setOnlineStatus(false);
      this.enqueueSync({ table: 'turns', action: 'upsert', payload: turn as unknown as Record<string, unknown> });
    }
  }

  // ==================== OBSERVATIONS (Teacher Logs) ====================
  public async getObservations(): Promise<ObservationRecord[]> {
    const localData = readLocal<ObservationRecord>(STORAGE_KEYS.observations, INITIAL_OBSERVATIONS);
    try {
      const { data, error } = await supabase
        .from('observations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        this.setOnlineStatus(true);
        const map = new Map<string, ObservationRecord>();
        for (const item of localData) map.set(item.observation_id, item);
        for (const r of data as ObservationRecord[]) {
          map.set(r.observation_id, {
            ...r,
            edit_history: Array.isArray(r.edit_history) ? r.edit_history : [],
          });
        }
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        writeLocal(STORAGE_KEYS.observations, merged);
        return merged;
      }
    } catch {
      this.setOnlineStatus(false);
    }
    return localData;
  }

  public async insertObservation(obs: ObservationRecord): Promise<ObservationRecord[]> {
    const list = readLocal<ObservationRecord>(STORAGE_KEYS.observations, INITIAL_OBSERVATIONS);
    list.unshift(obs);
    writeLocal(STORAGE_KEYS.observations, list);

    try {
      const { error } = await supabase.from('observations').insert(obs);
      if (error) {
        this.enqueueSync({
          table: 'observations',
          action: 'upsert',
          payload: obs as unknown as Record<string, unknown>,
        });
      } else {
        this.setOnlineStatus(true);
      }
    } catch {
      this.setOnlineStatus(false);
      this.enqueueSync({
        table: 'observations',
        action: 'upsert',
        payload: obs as unknown as Record<string, unknown>,
      });
    }

    return list;
  }

  public async updateObservation(
    observation_id: string,
    updates: {
      note_text: string;
      response_type: ObservationRecord['response_type'];
      support_level: ObservationRecord['support_level'];
      initiation_type: ObservationRecord['initiation_type'];
      interaction_partner: ObservationRecord['interaction_partner'];
    }
  ): Promise<ObservationRecord[]> {
    const list = readLocal<ObservationRecord>(STORAGE_KEYS.observations, INITIAL_OBSERVATIONS);
    const idx = list.findIndex((o) => o.observation_id === observation_id);
    if (idx === -1) return list;

    const existing = list[idx];
    const historyEntry = {
      previous_text: existing.note_text,
      previous_response_type: existing.response_type,
      previous_support_level: existing.support_level,
      edited_at: new Date().toISOString(),
    };

    const updatedRecord: ObservationRecord = {
      ...existing,
      ...updates,
      edit_history: [...(existing.edit_history || []), historyEntry],
      updated_at: new Date().toISOString(),
    };

    list[idx] = updatedRecord;
    writeLocal(STORAGE_KEYS.observations, list);

    try {
      const { error } = await supabase
        .from('observations')
        .update({
          note_text: updatedRecord.note_text,
          response_type: updatedRecord.response_type,
          support_level: updatedRecord.support_level,
          initiation_type: updatedRecord.initiation_type,
          interaction_partner: updatedRecord.interaction_partner,
          edit_history: updatedRecord.edit_history,
          updated_at: updatedRecord.updated_at,
        })
        .eq('observation_id', observation_id);

      if (error) {
        this.enqueueSync({
          table: 'observations',
          action: 'upsert',
          payload: updatedRecord as unknown as Record<string, unknown>,
        });
      } else {
        this.setOnlineStatus(true);
      }
    } catch {
      this.setOnlineStatus(false);
      this.enqueueSync({
        table: 'observations',
        action: 'upsert',
        payload: updatedRecord as unknown as Record<string, unknown>,
      });
    }

    return list;
  }

  public async deleteObservation(observation_id: string): Promise<ObservationRecord[]> {
    const list = readLocal<ObservationRecord>(STORAGE_KEYS.observations, INITIAL_OBSERVATIONS).filter(
      (o) => o.observation_id !== observation_id
    );
    writeLocal(STORAGE_KEYS.observations, list);

    try {
      const { error } = await supabase.from('observations').delete().eq('observation_id', observation_id);
      if (error) {
        this.enqueueSync({
          table: 'observations',
          action: 'delete',
          primaryKey: 'observation_id',
          payload: { observation_id },
        });
      }
    } catch {
      this.setOnlineStatus(false);
      this.enqueueSync({
        table: 'observations',
        action: 'delete',
        primaryKey: 'observation_id',
        payload: { observation_id },
      });
    }

    return list;
  }

  // ==================== SYSTEM EVENTS ====================
  public async getSystemEvents(): Promise<SystemEventRecord[]> {
    const localData = readLocal<SystemEventRecord>(STORAGE_KEYS.system_events, INITIAL_SYSTEM_EVENTS);
    try {
      const { data, error } = await supabase
        .from('system_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && Array.isArray(data) && data.length > 0) {
        this.setOnlineStatus(true);
        const map = new Map<string, SystemEventRecord>();
        for (const item of localData) map.set(item.event_id, item);
        for (const r of data as SystemEventRecord[]) map.set(r.event_id, r);
        const merged = Array.from(map.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        writeLocal(STORAGE_KEYS.system_events, merged);
        return merged;
      }
    } catch {
      this.setOnlineStatus(false);
    }
    return localData;
  }

  public async logSystemEvent(
    event: Omit<SystemEventRecord, 'event_id' | 'source' | 'created_at'>
  ): Promise<SystemEventRecord[]> {
    const newEvent: SystemEventRecord = {
      ...event,
      event_id: `EVT-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      source: 'system',
      created_at: new Date().toISOString(),
    };

    const list = readLocal<SystemEventRecord>(STORAGE_KEYS.system_events, INITIAL_SYSTEM_EVENTS);
    list.unshift(newEvent);
    writeLocal(STORAGE_KEYS.system_events, list);

    try {
      const { error } = await supabase.from('system_events').insert(newEvent);
      if (error) {
        this.enqueueSync({
          table: 'system_events',
          action: 'upsert',
          payload: newEvent as unknown as Record<string, unknown>,
        });
      } else {
        this.setOnlineStatus(true);
      }
    } catch {
      this.setOnlineStatus(false);
      this.enqueueSync({
        table: 'system_events',
        action: 'upsert',
        payload: newEvent as unknown as Record<string, unknown>,
      });
    }

    return list;
  }

  public async deleteSystemEvent(event_id: string): Promise<SystemEventRecord[]> {
    const list = readLocal<SystemEventRecord>(STORAGE_KEYS.system_events, INITIAL_SYSTEM_EVENTS).filter(
      (e) => e.event_id !== event_id
    );
    writeLocal(STORAGE_KEYS.system_events, list);

    try {
      await supabase.from('system_events').delete().eq('event_id', event_id);
    } catch {
      // ignore offline delete error after local removal
    }

    return list;
  }

  // ==================== BACKUP & RESTORE ====================
  public exportFullBackupJSON(): string {
    const backup = {
      app: 'ASMAE EDU-INCLUSION | أسماء',
      exported_at: new Date().toISOString(),
      children: readLocal(STORAGE_KEYS.children, INITIAL_CHILDREN),
      sessions: readLocal(STORAGE_KEYS.sessions, []),
      turns: readLocal(STORAGE_KEYS.turns, []),
      observations: readLocal(STORAGE_KEYS.observations, INITIAL_OBSERVATIONS),
      system_events: readLocal(STORAGE_KEYS.system_events, INITIAL_SYSTEM_EVENTS),
    };
    return JSON.stringify(backup, null, 2);
  }

  public importFullBackupJSON(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (Array.isArray(parsed.children)) {
        writeLocal(STORAGE_KEYS.children, parsed.children);
      }
      if (Array.isArray(parsed.sessions)) {
        writeLocal(STORAGE_KEYS.sessions, parsed.sessions);
      }
      if (Array.isArray(parsed.turns)) {
        writeLocal(STORAGE_KEYS.turns, parsed.turns);
      }
      if (Array.isArray(parsed.observations)) {
        writeLocal(STORAGE_KEYS.observations, parsed.observations);
      }
      if (Array.isArray(parsed.system_events)) {
        writeLocal(STORAGE_KEYS.system_events, parsed.system_events);
      }
      return true;
    } catch {
      return false;
    }
  }
}

export const db = new DualSyncDatabase();
