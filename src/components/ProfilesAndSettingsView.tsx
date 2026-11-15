import React, { useState } from 'react';
import { ChildProfile, LanguageLevel, ValidationResult } from '../types';
import { FORBIDDEN_WORDS, validateOutput } from '../data/curriculum';
import {
  ASMAE_VOICE_OPTIONS,
  DEFAULT_VOICE_ID,
  speechService,
} from '../services/speech';
import {
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Save,
  Trash2,
  Download,
  Upload,
  CheckCircle2,
  Edit3,
  ChevronDown,
  ChevronUp,
  Volume2,
} from 'lucide-react';

interface ProfilesAndSettingsViewProps {
  childrenList: ChildProfile[];
  onSaveChild: (child: ChildProfile) => Promise<void>;
  onDeleteChild: (child_id: string) => Promise<void>;
  onExportBackup: () => string;
  onImportBackup: (json: string) => Promise<boolean>;
  onLogSafetyTest: (sampleText: string, result: ValidationResult) => Promise<void>;
}

const AVATAR_SYMBOLS = ['🌟', '🌿', '🌊', '☀️', '🦋', '🍀', '🌙', '🌈'];

const LANGUAGE_LEVEL_LABELS: Record<LanguageLevel, { title: string; desc: string }> = {
  1: { title: 'المستوى 1 (بسيط جداً)', desc: 'كلمتان إلى 4 كلمات مباشرة' },
  2: { title: 'المستوى 2 (متوسط)', desc: 'جملة قصيرة واضحة (5-8 كلمات)' },
  3: { title: 'المستوى 3 (موسع)', desc: 'جملتان كاملتان وهادئتان' },
};

const PRESET_FILTER_TESTS = [
  {
    label: 'مثال آمن ومعتمد (مقبول)',
    text: 'صَبَاحُ الخَيْرِ يَا صَدِيقِي. اخْتَرْ بِطَاقَةَ التَّحِيَّةِ.',
  },
  {
    label: 'مثال يحتوي مصطلح تشخيصي محظور (مرفوض)',
    text: 'أنت طفل لديك توحد ويجب متابعة علاج وتشخيص حالتك.',
  },
  {
    label: 'مثال يحتوي حكم تقييمي سلبي (مرفوض)',
    text: 'هذا خطأ وفشل في الإجابة، درجة سيئة اليوم.',
  },
];

export const ProfilesAndSettingsView: React.FC<ProfilesAndSettingsViewProps> = ({
  childrenList,
  onSaveChild,
  onDeleteChild,
  onExportBackup,
  onImportBackup,
  onLogSafetyTest,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChildId, setEditingChildId] = useState<string | null>(null);
  const [alias, setAlias] = useState('');
  const [avatarSymbol, setAvatarSymbol] = useState('🌟');
  const [ageBand, setAgeBand] = useState<'6-8' | '9-10' | '11-12'>('6-8');
  const [commMode, setCommMode] = useState<ChildProfile['communication_mode']>('بصري / بطاقات');
  const [langLevel, setLangLevel] = useState<LanguageLevel>(1);
  const [waitTime, setWaitTime] = useState<number>(10);
  const [sensoryNotes, setSensoryNotes] = useState('');

  // ElevenLabs Voice Selection State
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ELEVENLABS_VOICE_ID') || DEFAULT_VOICE_ID;
    }
    return DEFAULT_VOICE_ID;
  });

  const [showAdvancedTools, setShowAdvancedTools] = useState(false);
  const [testInput, setTestInput] = useState(PRESET_FILTER_TESTS[0].text);
  const [testResult, setTestResult] = useState<ValidationResult>(() =>
    validateOutput(PRESET_FILTER_TESTS[0].text)
  );
  const [backupStatus, setBackupStatus] = useState<string | null>(null);

  const handleVoiceChange = (voiceId: string) => {
    setSelectedVoiceId(voiceId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ELEVENLABS_VOICE_ID', voiceId);
    }
    speechService.speak('صَبَاحُ الخَيْرِ يَا أَصْدِقَاءْ، أَهْلاً بِكُمْ فِي القِسْمْ.');
  };

  const handleEditChild = (child: ChildProfile) => {
    setEditingChildId(child.child_id);
    setAlias(child.alias);
    setAvatarSymbol(child.avatar_symbol);
    setAgeBand(child.age_band);
    setCommMode(child.communication_mode);
    setLangLevel(child.language_level);
    setWaitTime(child.wait_time);
    setSensoryNotes(child.preferences?.sensory_notes || '');
    setShowAddForm(true);
  };

  const resetChildForm = () => {
    setEditingChildId(null);
    setAlias('');
    setAvatarSymbol('🌟');
    setAgeBand('6-8');
    setCommMode('بصري / بطاقات');
    setLangLevel(1);
    setWaitTime(10);
    setSensoryNotes('');
    setShowAddForm(false);
  };

  const handleQuickLevelChange = async (child: ChildProfile, newLevel: LanguageLevel) => {
    await onSaveChild({
      ...child,
      language_level: newLevel,
    });
  };

  const handleChildSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alias.trim()) return;

    const profile: ChildProfile = {
      child_id: editingChildId || `CH-${Date.now().toString().slice(-4)}`,
      alias: alias.trim(),
      avatar_symbol: avatarSymbol,
      age_band: ageBand,
      communication_mode: commMode,
      language_level: langLevel,
      wait_time: Number(waitTime) || 10,
      preferences: {
        sensory_notes: sensoryNotes.trim(),
        calm_reinforcer: 'ثناء هادئ',
        avoid_triggers: 'الأصوات المفاجئة',
      },
      created_at: new Date().toISOString(),
    };

    await onSaveChild(profile);
    resetChildForm();
  };

  const handleRunSafetyTest = async (textToValidate: string) => {
    setTestInput(textToValidate);
    const res = validateOutput(textToValidate);
    setTestResult(res);
    await onLogSafetyTest(textToValidate, res);
  };

  const handleDownloadBackup = () => {
    const json = onExportBackup();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asmae_backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setBackupStatus('تم تنزيل النسخة الاحتياطية بنجاح.');
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const content = String(ev.target?.result || '');
      const ok = await onImportBackup(content);
      setBackupStatus(
        ok ? 'تم استرجاع النسخة الاحتياطية بنجاح.' : 'تأكد من صحة ملف JSON.'
      );
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header + Add Child Button */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1D3557]">
            إدارة الأطفال ومستوى اللغة وإعدادات الصوت
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            حدد المستوى اللغوي لكل طفل (1 أو 2 أو 3) ليقوم الذكاء الاصطناعي (Gemini) بتبسيط الجمل على قدر مستواه، واختر نبرة صوت المعلمة «أسماء».
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (showAddForm) {
              resetChildForm();
            } else {
              setShowAddForm(true);
            }
          }}
          className="py-3 px-5 rounded-xl bg-[#1D3557] text-white text-sm font-bold hover:bg-[#1D3557]/90 flex items-center gap-2 calm-transition whitespace-nowrap shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>{showAddForm ? 'إغلاق النموذج' : '+ إضافة طفل جديد'}</span>
        </button>
      </div>

      {/* Add / Edit Child Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border-2 border-[#457B9D] p-6 space-y-5">
          <h2 className="text-lg font-bold text-[#1D3557]">
            {editingChildId ? 'تعديل بيانات الطفل' : 'إضافة طفل جديد للمجموعة'}
          </h2>

          <form onSubmit={handleChildSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-[#1D3557] mb-2">
                اختر الرمز المحبب للطفل:
              </label>
              <div className="flex flex-wrap gap-2">
                {AVATAR_SYMBOLS.map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setAvatarSymbol(sym)}
                    className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center border-2 ${
                      avatarSymbol === sym
                        ? 'bg-[#D8E2DC] border-[#1D3557]'
                        : 'bg-[#F7F9F9] border-slate-200 hover:bg-[#D8E2DC]/40'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#1D3557] mb-1">
                  الاسم المستعار للطفل *
                </label>
                <input
                  type="text"
                  required
                  value={alias}
                  onChange={(e) => setAlias(e.target.value)}
                  placeholder="مثال: نجم 1"
                  className="w-full rounded-xl border border-slate-300 bg-[#F7F9F9] px-3.5 py-2.5 text-sm text-[#1D3557]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1D3557] mb-1">
                  المستوى اللغوي (لتبسيط Gemini)
                </label>
                <select
                  value={langLevel}
                  onChange={(e) => setLangLevel(Number(e.target.value) as LanguageLevel)}
                  className="w-full rounded-xl border border-slate-300 bg-[#F7F9F9] px-3.5 py-2.5 text-sm text-[#1D3557]"
                >
                  <option value={1}>المستوى 1: بسيط جداً (كلمتان - 4 كلمات)</option>
                  <option value={2}>المستوى 2: متوسط (جملة قصيرة)</option>
                  <option value={3}>المستوى 3: موسع (جملتان هادئتان)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1D3557] mb-1">
                  طريقة التواصل المفضلة
                </label>
                <select
                  value={commMode}
                  onChange={(e) =>
                    setCommMode(e.target.value as ChildProfile['communication_mode'])
                  }
                  className="w-full rounded-xl border border-slate-300 bg-[#F7F9F9] px-3.5 py-2.5 text-sm text-[#1D3557]"
                >
                  <option value="بصري / بطاقات">بصري / بطاقات مصورة</option>
                  <option value="لفظي">لفظي (كلام)</option>
                  <option value="إشارة + لفظي محدود">إشارة + لفظي محدود</option>
                  <option value="متنوع">متنوع</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#1D3557] mb-1">
                  ملاحظة للمعلم حول ما يريح الطفل (اختياري)
                </label>
                <input
                  type="text"
                  value={sensoryNotes}
                  onChange={(e) => setSensoryNotes(e.target.value)}
                  placeholder="مثال: يحب البطاقات الملونة والصوت الهادئ..."
                  className="w-full rounded-xl border border-slate-300 bg-[#F7F9F9] px-3.5 py-2 text-sm text-[#1D3557]"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1D3557] mb-1">
                  الفئة العمرية
                </label>
                <select
                  value={ageBand}
                  onChange={(e) => setAgeBand(e.target.value as ChildProfile['age_band'])}
                  className="w-full rounded-xl border border-slate-300 bg-[#F7F9F9] px-3.5 py-2 text-sm text-[#1D3557]"
                >
                  <option value="6-8">6 - 8 سنوات</option>
                  <option value="9-10">9 - 10 سنوات</option>
                  <option value="11-12">11 - 12 سنة</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={resetChildForm}
                className="py-2.5 px-4 rounded-xl border border-slate-300 text-sm font-medium text-slate-700"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-[#1D3557] text-white text-sm font-bold hover:bg-[#1D3557]/90 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>حفظ بيانات الطفل في Supabase</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clean Grid of Child Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {childrenList.map((child) => (
          <div
            key={child.child_id}
            className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-5 shadow-xs"
          >
            <div className="space-y-4">
              {/* Child Avatar & Name */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-2xl bg-[#D8E2DC]/70 flex items-center justify-center text-3xl">
                    {child.avatar_symbol}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-[#1D3557]">{child.alias}</h3>
                    <p className="text-xs text-slate-500">
                      العمر: {child.age_band} سنوات · {child.communication_mode}
                    </p>
                  </div>
                </div>
              </div>

              {/* Direct Language Level Selector on the Card */}
              <div className="bg-[#F7F9F9] p-3.5 rounded-xl border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-[#1D3557]">
                  مستوى اللغة (لتبسيط الجمل):
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {([1, 2, 3] as LanguageLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => handleQuickLevelChange(child, lvl)}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border calm-transition ${
                        child.language_level === lvl
                          ? 'bg-[#1D3557] text-white border-[#1D3557]'
                          : 'bg-white text-[#1D3557] border-slate-200 hover:bg-[#D8E2DC]/40'
                      }`}
                    >
                      مستوى {lvl}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[#457B9D] font-medium">
                  {LANGUAGE_LEVEL_LABELS[child.language_level].desc}
                </p>
              </div>

              {child.preferences?.sensory_notes && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  💡 {child.preferences.sensory_notes}
                </p>
              )}
            </div>

            {/* Edit / Delete Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleEditChild(child)}
                className="py-1.5 px-3 rounded-lg border border-slate-200 text-xs font-semibold text-[#1D3557] hover:bg-[#D8E2DC]/40 flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>تعديل البيانات</span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteChild(child.child_id)}
                className="py-1.5 px-3 rounded-lg border border-red-200 text-xs font-semibold text-red-700 hover:bg-red-50 flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ElevenLabs Neural Voice Selection Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#1D3557] flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[#457B9D]" />
              <span>اختيار صوت المعلمة «أسماء» (ElevenLabs Multilingual v2)</span>
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              نطق عربي فصيح ومتأنٍ بصيغة MP3 عالية الوضوح مع ثبات صوتي هادئ (`stability: 0.90`, `speed: 0.78`) ووقفات تنفس لطيفة وتسكين أواخر الجمل.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              speechService.speak('صَبَاحُ الخَيْرِ يَا أَصْدِقَاءْ، أَهْلاً بِكُمْ فِي القِسْمْ.')
            }
            className="py-2.5 px-4 rounded-xl bg-[#1D3557] text-white text-xs font-bold hover:bg-[#1D3557]/90 flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Volume2 className="w-4 h-4" />
            <span>🔊 تجربة الصوت المختار</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {ASMAE_VOICE_OPTIONS.map((v) => {
            const isSelected = selectedVoiceId === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => handleVoiceChange(v.id)}
                className={`p-4 rounded-xl border-2 text-right flex flex-col justify-between gap-1.5 calm-transition ${
                  isSelected
                    ? 'bg-[#D8E2DC]/70 border-[#1D3557]'
                    : 'bg-[#F7F9F9] border-slate-200 hover:bg-[#D8E2DC]/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#1D3557]">{v.name}</span>
                  {isSelected && (
                    <span className="text-xs font-bold text-emerald-800">✓ مفعل حالياً</span>
                  )}
                </div>
                <p className="text-xs text-slate-600">{v.description}</p>
                <span className="text-[11px] text-slate-400 font-mono-num">
                  Voice ID: {v.id}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Advanced Tools (Safety Filter Tester + JSON Backup) */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedTools(!showAdvancedTools)}
          className="w-full px-6 py-4 flex items-center justify-between text-right hover:bg-slate-50 calm-transition"
        >
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#457B9D]" />
            <span className="font-bold text-sm text-[#1D3557]">
              أدوات الفحص المتقدمة للمعلم (اختبار فلتر الأمان اللغوي + النسخ الاحتياطي)
            </span>
          </div>
          {showAdvancedTools ? (
            <ChevronUp className="w-5 h-5 text-slate-500" />
          ) : (
            <ChevronDown className="w-5 h-5 text-slate-500" />
          )}
        </button>

        {showAdvancedTools && (
          <div className="p-6 border-t border-slate-200 space-y-6 bg-[#F7F9F9]/50">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-3">
                <label className="block text-xs font-bold text-[#1D3557]">
                  اختبر فلتر حماية الطفل (`validateOutput`) ضد الكلمات المحظورة ({FORBIDDEN_WORDS.slice(0, 6).join('، ')}...):
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_FILTER_TESTS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleRunSafetyTest(preset.text)}
                      className="py-1.5 px-3 rounded-lg border border-slate-300 bg-white text-xs font-medium text-[#1D3557] hover:bg-[#D8E2DC]/60"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={testInput}
                  onChange={(e) => {
                    setTestInput(e.target.value);
                    setTestResult(validateOutput(e.target.value));
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-[#1D3557]"
                />
              </div>

              <div className="lg:col-span-5">
                <div
                  className={`p-4 rounded-xl border h-full flex flex-col justify-center space-y-2 ${
                    testResult.valid
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                      : 'bg-red-50 border-red-300 text-red-950'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {testResult.valid ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                        <span>نص مقبول وآمن للطفل</span>
                      </>
                    ) : (
                      <>
                        <ShieldAlert className="w-5 h-5 text-red-700 shrink-0" />
                        <span>مرفوض بفلتر الأمان</span>
                      </>
                    )}
                  </div>
                  <p className="text-xs">
                    عدد الكلمات: {testResult.wordCount}/15 · عدد الجمل: {testResult.sentenceCount}/2
                  </p>
                  {testResult.rejectedReason && (
                    <p className="text-xs font-bold text-red-800">{testResult.rejectedReason}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <div className="text-xs text-slate-600">
                النسخ الاحتياطي لبيانات التطبيق (JSON):
                {backupStatus && <span className="font-bold text-[#457B9D] mr-2">{backupStatus}</span>}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="py-2 px-4 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#1D3557] flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>تنزيل نسخة احتياطية</span>
                </button>
                <label className="py-2 px-4 rounded-lg bg-[#1D3557] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>استرجاع نسخة</span>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleUploadBackup}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
