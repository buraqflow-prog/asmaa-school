import React, { useState, useEffect } from 'react';
import {
  ActivityId,
  ChildProfile,
  InitiationType,
  InteractionPartner,
  ResponseType,
  SupportLevel,
} from '../types';
import { Check, X } from 'lucide-react';

interface ResponseLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  turnId: string;
  activityId: ActivityId;
  variation: string;
  stepId: number;
  currentChild: ChildProfile | null;
  defaultResponseType?: ResponseType;
  defaultSupportLevel?: SupportLevel;
  defaultInteractionPartner?: InteractionPartner;
  selectedCardLabel?: string | null;
  waitElapsedSec: number;
  requiresPeerCooperation?: boolean;
  onSaveLog: (data: {
    response_type: ResponseType;
    initiation_type: InitiationType;
    support_level: SupportLevel;
    interaction_partner: InteractionPartner;
    peer_cooperation: boolean | null;
    note_text: string;
  }) => Promise<void>;
}

const QUICK_RESPONSE_OPTIONS: Array<{
  value: ResponseType;
  icon: string;
  title: string;
  subtitle: string;
}> = [
  {
    value: 'كلام',
    icon: '🗣️',
    title: 'تكلم',
    subtitle: 'نطق الكلمة أو الجملة',
  },
  {
    value: 'اختيار صورة',
    icon: '🖼️',
    title: 'اختار بطاقة',
    subtitle: 'نقر على البطاقة المصورة',
  },
  {
    value: 'إشارة',
    icon: '👉',
    title: 'أشار بيده',
    subtitle: 'لوح بيده أو أشار للشاشة',
  },
  {
    value: 'تفاعل مع زميل',
    icon: '🤝',
    title: 'تفاعل مع زميل',
    subtitle: 'تواصل مع صديقه في الصف',
  },
  {
    value: 'صمت / انتظار هادئ',
    icon: '😌',
    title: 'انتظار هادئ',
    subtitle: 'استمع بهدوء بدون استجابة',
  },
];

const SUPPORT_LEVELS: SupportLevel[] = [
  'مستقل',
  'إعادة',
  'تبسيط',
  'خياران بصريان',
  'مساعدة بشرية',
];

export const ResponseLogModal: React.FC<ResponseLogModalProps> = ({
  isOpen,
  onClose,
  stepId,
  currentChild,
  defaultResponseType = 'اختيار صورة',
  defaultSupportLevel = 'مستقل',
  defaultInteractionPartner = 'أسماء',
  selectedCardLabel,
  waitElapsedSec,
  requiresPeerCooperation = false,
  onSaveLog,
}) => {
  const [responseType, setResponseType] = useState<ResponseType>(defaultResponseType);
  const [initiationType, setInitiationType] = useState<InitiationType>('استجابة بعد التعليمة');
  const [supportLevel, setSupportLevel] = useState<SupportLevel>(defaultSupportLevel);
  const [interactionPartner, setInteractionPartner] = useState<InteractionPartner>(defaultInteractionPartner);
  const [peerCooperation, setPeerCooperation] = useState<boolean | null>(
    requiresPeerCooperation ? true : null
  );
  const [noteText, setNoteText] = useState<string>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setResponseType(defaultResponseType);
      setSupportLevel(defaultSupportLevel);
      setInteractionPartner(defaultInteractionPartner);
      setInitiationType(
        defaultSupportLevel === 'مستقل' ? 'استجابة بعد التعليمة' : 'استجابة بعد تلميح'
      );
      setPeerCooperation(requiresPeerCooperation ? true : null);
      if (selectedCardLabel) {
        setNoteText(`اختار البطاقة المصورة (${selectedCardLabel}) بهدوء.`);
      } else {
        setNoteText('');
      }
    }
  }, [
    isOpen,
    defaultResponseType,
    defaultSupportLevel,
    defaultInteractionPartner,
    selectedCardLabel,
    requiresPeerCooperation,
  ]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSaveLog({
        response_type: responseType,
        initiation_type: initiationType,
        support_level: supportLevel,
        interaction_partner: interactionPartner,
        peer_cooperation: peerCooperation,
        note_text:
          noteText.trim() ||
          `تفاعل الطفل عبر (${responseType}) — مستوى المساعدة: (${supportLevel}).`,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#1D3557]/45 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="log-modal-title"
    >
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-sm max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-200">
          <div>
            <h2 id="log-modal-title" className="text-xl font-bold text-[#1D3557]">
              📝 كيف تفاعل الطفل في هذه الخطوة؟
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              الطفل الحالي:{' '}
              <strong className="text-[#1D3557]">
                {currentChild ? `${currentChild.avatar_symbol} ${currentChild.alias}` : 'غير محدد'}
              </strong>{' '}
              · الخطوة {stepId}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {/* 1. Large Visual Cards for "How did the child respond?" */}
          <div>
            <label className="block text-sm font-bold text-[#1D3557] mb-2.5">
              1. اختر طريقة تفاعل الطفل:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUICK_RESPONSE_OPTIONS.map((opt) => {
                const active = responseType === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setResponseType(opt.value);
                      if (opt.value === 'تفاعل مع زميل') {
                        setInteractionPartner('زميل فعلي');
                        setPeerCooperation(true);
                      }
                    }}
                    className={`p-3.5 rounded-xl border-2 text-right flex items-center gap-3 calm-transition ${
                      active
                        ? 'bg-[#D8E2DC]/80 border-[#1D3557] text-[#1D3557]'
                        : 'bg-[#F7F9F9] border-slate-200 text-[#1D3557] hover:bg-[#D8E2DC]/30'
                    }`}
                  >
                    <span className="text-3xl shrink-0">{opt.icon}</span>
                    <div>
                      <div className="font-bold text-base">{opt.title}</div>
                      <div className="text-xs text-slate-600">{opt.subtitle}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Support Level */}
          <div>
            <label className="block text-sm font-bold text-[#1D3557] mb-2">
              2. هل احتاج الطفل إلى مساعدة؟
            </label>
            <div className="flex flex-wrap gap-2">
              {SUPPORT_LEVELS.map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setSupportLevel(lvl);
                    setInitiationType(
                      lvl === 'مستقل' ? 'استجابة بعد التعليمة' : 'استجابة بعد تلميح'
                    );
                  }}
                  className={`py-2 px-3.5 rounded-lg text-xs font-bold border calm-transition whitespace-nowrap shrink-0 ${
                    supportLevel === lvl
                      ? 'bg-[#1D3557] text-white border-[#1D3557]'
                      : 'bg-[#F7F9F9] text-[#1D3557] border-slate-200 hover:bg-[#D8E2DC]/50'
                  }`}
                >
                  {lvl === 'مستقل' ? 'مستقل (بدون مساعدة)' : lvl}
                </button>
              ))}
            </div>
          </div>

          {/* 3. Optional Teacher Note */}
          <div>
            <label htmlFor="teacher-free-note" className="block text-sm font-bold text-[#1D3557] mb-1.5">
              3. ملاحظة إضافية للمعلم (اختياري):
            </label>
            <textarea
              id="teacher-free-note"
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="مثال: استجاب بابتسامة هادئة بعد سماع صوت أسماء..."
              className="w-full rounded-xl border border-slate-300 bg-[#F7F9F9] px-3.5 py-2.5 text-sm text-[#1D3557] focus:outline-none focus:border-[#1D3557]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl border border-slate-300 text-sm font-medium text-slate-700 hover:bg-slate-100 whitespace-nowrap shrink-0"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={saving}
              className="py-2.5 px-6 rounded-xl bg-emerald-700 text-white text-sm font-bold hover:bg-emerald-800 flex items-center gap-2 whitespace-nowrap shrink-0"
            >
              <Check className="w-4 h-4" />
              <span>{saving ? 'جاري الحفظ...' : 'حفظ التفاعل في Supabase'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
