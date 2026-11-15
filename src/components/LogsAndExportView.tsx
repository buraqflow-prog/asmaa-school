import React, { useState } from 'react';
import {
  InitiationType,
  InteractionPartner,
  ObservationRecord,
  ResponseType,
  SupportLevel,
  SystemEventRecord,
  TurnRecord,
} from '../types';
import { Download, Edit3, Trash2, Check, X, FileSpreadsheet } from 'lucide-react';

interface LogsAndExportViewProps {
  observations: ObservationRecord[];
  systemEvents: SystemEventRecord[];
  turns: TurnRecord[];
  onUpdateObservation: (
    observation_id: string,
    updates: {
      note_text: string;
      response_type: ResponseType;
      support_level: SupportLevel;
      initiation_type: InitiationType;
      interaction_partner: InteractionPartner;
    }
  ) => Promise<void>;
  onDeleteObservation: (observation_id: string) => Promise<void>;
  onDeleteSystemEvent: (event_id: string) => Promise<void>;
  onOpenNewObservationModal: () => void;
}

const ACTIVITY_LABELS: Record<string, string> = {
  greeting: 'الوحدة 1: التحية',
  turn_taking: 'الوحدة 2: انتظار الدور',
  classroom_participation: 'الوحدة 3: المشاركة الصفية',
};

export const LogsAndExportView: React.FC<LogsAndExportViewProps> = ({
  observations,
  systemEvents,
  turns,
  onUpdateObservation,
  onDeleteObservation,
  onDeleteSystemEvent,
  onOpenNewObservationModal,
}) => {
  const [activeTab, setActiveTab] = useState<'teacher' | 'system'>('teacher');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNoteText, setEditNoteText] = useState<string>('');
  const [editResponseType, setEditResponseType] = useState<ResponseType>('كلام');
  const [editSupportLevel, setEditSupportLevel] = useState<SupportLevel>('مستقل');
  const [editInitiationType, setEditInitiationType] = useState<InitiationType>('استجابة بعد التعليمة');
  const [editPartner, setEditPartner] = useState<InteractionPartner>('أسماء');

  const startEditing = (obs: ObservationRecord) => {
    setEditingId(obs.observation_id);
    setEditNoteText(obs.note_text);
    setEditResponseType(obs.response_type);
    setEditSupportLevel(obs.support_level);
    setEditInitiationType(obs.initiation_type);
    setEditPartner(obs.interaction_partner);
  };

  const handleSaveEdit = async (observation_id: string) => {
    if (!editNoteText.trim()) return;
    await onUpdateObservation(observation_id, {
      note_text: editNoteText.trim(),
      response_type: editResponseType,
      support_level: editSupportLevel,
      initiation_type: editInitiationType,
      interaction_partner: editPartner,
    });
    setEditingId(null);
  };

  const exportArabicCSV = () => {
    const headers = [
      'معرف السجل',
      'الطفل',
      'الوحدة التعليمية',
      'الخطوة',
      'كيف تفاعل الطفل',
      'المبادرة',
      'مستوى المساعدة',
      'الطرف المتفاعل معه',
      'ملاحظة المعلم',
      'التاريخ والوقت',
    ];

    const escapeCsv = (val: unknown) => {
      const str = val === null || val === undefined ? '' : String(val);
      return `"${str.replace(/"/g, '""')}"`;
    };

    const rows = observations.map((obs) => [
      obs.observation_id,
      obs.child_alias,
      ACTIVITY_LABELS[obs.activity_id] || obs.activity_id,
      `الخطوة ${obs.step_id}`,
      obs.response_type,
      obs.initiation_type,
      obs.support_level,
      obs.interaction_partner,
      obs.note_text,
      new Date(obs.created_at).toLocaleString('ar-MA'),
    ]);

    const obsTurnIds = new Set(observations.map((o) => o.turn_id));
    for (const t of turns) {
      if (!obsTurnIds.has(t.turn_id)) {
        rows.push([
          t.turn_id,
          t.child_alias,
          ACTIVITY_LABELS[t.activity_id] || t.activity_id,
          `الخطوة ${t.step_id}`,
          t.response_type,
          t.initiation_type,
          t.support_level,
          t.interaction_partner,
          `التعليمة: ${t.prompt_text}`,
          new Date(t.created_at).toLocaleString('ar-MA'),
        ]);
      }
    }

    const csvContent =
      '\uFEFF' +
      [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\r\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `تقرير_أسماء_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner + Large Green Excel Download Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <h1 className="text-2xl font-bold text-[#1D3557]">
            التقارير وسجل تفاعل الأطفال (Excel / Supabase)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            جميع التفاعلات والملاحظات المسجلة محفوظة في قاعدة البيانات وجاهزة للتحميل في ملف Excel يدعم اللغة العربية بالكامل.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenNewObservationModal}
            className="py-3 px-4 rounded-xl border border-[#1D3557] text-[#1D3557] text-sm font-bold hover:bg-[#D8E2DC]/50 calm-transition whitespace-nowrap shrink-0"
          >
            + إضافة ملاحظة جديدة
          </button>

          <button
            type="button"
            onClick={exportArabicCSV}
            className="py-3.5 px-6 rounded-xl bg-emerald-700 text-white text-base font-bold hover:bg-emerald-800 flex items-center gap-2.5 shadow-xs calm-transition whitespace-nowrap shrink-0"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <Download className="w-5 h-5" />
            <span>تحميل التقرير لبرنامج Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* Simple Tab Switcher */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('teacher')}
          className={`py-2.5 px-5 rounded-xl text-sm font-bold calm-transition ${
            activeTab === 'teacher'
              ? 'bg-[#1D3557] text-white'
              : 'bg-white text-[#1D3557] border border-slate-200 hover:bg-[#D8E2DC]/40'
          }`}
        >
          جدول تفاعل الأطفال وملاحظات المعلم ({observations.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('system')}
          className={`py-2.5 px-5 rounded-xl text-sm font-bold calm-transition ${
            activeTab === 'system'
              ? 'bg-[#1D3557] text-white'
              : 'bg-white text-[#1D3557] border border-slate-200 hover:bg-[#D8E2DC]/40'
          }`}
        >
          سجل أحداث النظام والذكاء الاصطناعي ({systemEvents.length})
        </button>
      </div>

      {/* Clear Table of Teacher Observations */}
      {activeTab === 'teacher' ? (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          {observations.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-base">
              لا توجد ملاحظات مسجلة بعد. اضغط على «📝 تسجيل كيف تفاعل الطفل» أثناء النشاط لإضافة أول سجل.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-[#F7F9F9] border-b border-slate-200 text-xs font-bold text-[#1D3557]">
                  <tr>
                    <th className="py-4 px-4">الطفل</th>
                    <th className="py-4 px-4">النشاط والخطوة</th>
                    <th className="py-4 px-4">كيف تفاعل الطفل</th>
                    <th className="py-4 px-4">مستوى المساعدة</th>
                    <th className="py-4 px-4">ملاحظة المعلم</th>
                    <th className="py-4 px-4">التوقيت</th>
                    <th className="py-4 px-4">تعديل / حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {observations.map((obs) => {
                    const isEditing = editingId === obs.observation_id;
                    return (
                      <tr key={obs.observation_id} className="hover:bg-[#F7F9F9]/70 align-top">
                        <td className="py-4 px-4 font-bold text-base text-[#1D3557] whitespace-nowrap">
                          {obs.child_alias}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-700 whitespace-nowrap">
                          <div className="font-bold">{ACTIVITY_LABELS[obs.activity_id] || obs.activity_id}</div>
                          <div className="text-slate-500">الخطوة {obs.step_id}</div>
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editResponseType}
                              onChange={(e) => setEditResponseType(e.target.value as ResponseType)}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                            >
                              <option value="كلام">كلام</option>
                              <option value="اختيار صورة">اختيار صورة</option>
                              <option value="إشارة">إشارة</option>
                              <option value="تفاعل مع زميل">تفاعل مع زميل</option>
                              <option value="صمت / انتظار هادئ">صمت / انتظار هادئ</option>
                            </select>
                          ) : (
                            <span className="font-bold text-[#1D3557]">{obs.response_type}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isEditing ? (
                            <select
                              value={editSupportLevel}
                              onChange={(e) => setEditSupportLevel(e.target.value as SupportLevel)}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                            >
                              <option value="مستقل">مستقل</option>
                              <option value="إعادة">إعادة</option>
                              <option value="تبسيط">تبسيط</option>
                              <option value="خياران بصريان">خياران بصريان</option>
                              <option value="مساعدة بشرية">مساعدة بشرية</option>
                            </select>
                          ) : (
                            <span className="text-xs font-semibold text-[#457B9D]">{obs.support_level}</span>
                          )}
                        </td>
                        <td className="py-4 px-4 max-w-md">
                          {isEditing ? (
                            <textarea
                              rows={2}
                              value={editNoteText}
                              onChange={(e) => setEditNoteText(e.target.value)}
                              className="w-full rounded-lg border border-slate-300 bg-white p-2 text-xs"
                            />
                          ) : (
                            <div>
                              <p className="text-sm text-[#1D3557] leading-relaxed">{obs.note_text}</p>
                              {obs.edit_history && obs.edit_history.length > 0 && (
                                <span className="text-[11px] text-slate-400 block mt-1">
                                  تم التعديل ({obs.edit_history.length} مرات)
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-xs text-slate-500 font-mono-num whitespace-nowrap">
                          {new Date(obs.created_at).toLocaleTimeString('ar-MA', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveEdit(obs.observation_id)}
                                className="p-1.5 rounded-lg bg-emerald-700 text-white hover:bg-emerald-800"
                                title="حفظ"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingId(null)}
                                className="p-1.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100"
                                title="إلغاء"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => startEditing(obs)}
                                className="p-1.5 rounded-lg border border-slate-200 text-[#1D3557] hover:bg-[#D8E2DC]/50"
                                title="تعديل"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteObservation(obs.observation_id)}
                                className="p-1.5 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                                title="حذف"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-[#F7F9F9] border-b border-slate-200 text-xs font-bold text-[#1D3557]">
                <tr>
                  <th className="py-3.5 px-4">التوقيت</th>
                  <th className="py-3.5 px-4">نوع الحدث</th>
                  <th className="py-3.5 px-4">حالة الذكاء الاصطناعي</th>
                  <th className="py-3.5 px-4">التفاصيل</th>
                  <th className="py-3.5 px-4">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {systemEvents.map((evt) => (
                  <tr key={evt.event_id} className="hover:bg-[#F7F9F9]/60">
                    <td className="py-3 px-4 text-xs text-slate-500 font-mono-num whitespace-nowrap">
                      {new Date(evt.created_at).toLocaleTimeString('ar-MA')}
                    </td>
                    <td className="py-3 px-4 font-mono-num text-xs font-bold text-[#1D3557] whitespace-nowrap">
                      {evt.event_type}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-700 whitespace-nowrap">
                      {evt.model_status === 'gemini_verified' && 'توليد Gemini موثق ✨'}
                      {evt.model_status === 'fallback_used' && 'نص احتياطي آمن'}
                      {evt.model_status === 'rejected_by_filter' && 'مرفوض بفلتر الأمان'}
                      {evt.model_status === 'static_used' && 'نص أساسي معتمد'}
                      {evt.model_status === 'system_state' && 'إجراء في الجلسة'}
                    </td>
                    <td className="py-3 px-4 text-xs text-[#1D3557]">{evt.details}</td>
                    <td className="py-3 px-4 text-xs">
                      <button
                        type="button"
                        onClick={() => onDeleteSystemEvent(evt.event_id)}
                        className="text-red-700 hover:underline text-xs"
                      >
                        حذف
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
