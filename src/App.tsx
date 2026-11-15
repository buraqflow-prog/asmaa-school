import React, { useState, useEffect, useRef } from 'react';
import {
  ActivityId,
  ChildProfile,
  InitiationType,
  InteractionPartner,
  ObservationRecord,
  PromptSource,
  ResponseType,
  SessionRecord,
  SupportLevel,
  SystemEventRecord,
  SystemState,
  TurnRecord,
  ValidationResult,
  VisualCard,
} from './types';
import {
  ACTIVITIES_CURRICULUM,
  FALLBACK_PROMPTS,
  SCIENTIFIC_RATIONALES,
  validateOutput,
} from './data/curriculum';
import { db } from './services/database';
import { speechService } from './services/speech';
import { AsmaeAvatar } from './components/AsmaeAvatar';
import { PecsCardIllustration } from './components/PecsCardIllustration';
import { ResponseLogModal } from './components/ResponseLogModal';
import { LogsAndExportView } from './components/LogsAndExportView';
import { ProfilesAndSettingsView } from './components/ProfilesAndSettingsView';
import {
  Volume2,
  OctagonAlert,
  Lightbulb,
  Eye,
  RotateCcw,
  Gauge,
} from 'lucide-react';

type ActiveScreen = 'classroom' | 'children' | 'reports';

const CARD_PASTEL_STYLES: Record<string, string> = {
  تحية: 'bg-[#EBF5FB] border-[#90CAF9] hover:border-[#457B9D]',
  زميل: 'bg-[#E8F6F3] border-[#80CBC4] hover:border-[#457B9D]',
  سلوك: 'bg-[#FEF9E7] border-[#FFE082] hover:border-[#457B9D]',
  'أدوات مدرسية': 'bg-[#EBF5FB] border-[#90CAF9] hover:border-[#457B9D]',
  الألوان: 'bg-[#F5EEF8] border-[#CE93D8] hover:border-[#457B9D]',
  ألوان: 'bg-[#F5EEF8] border-[#CE93D8] hover:border-[#457B9D]',
  حيوانات: 'bg-[#FEF9E7] border-[#FFE082] hover:border-[#457B9D]',
  تناوب: 'bg-[#E8F6F3] border-[#80CBC4] hover:border-[#457B9D]',
  تعاون: 'bg-[#E8F6F3] border-[#80CBC4] hover:border-[#457B9D]',
  غلق: 'bg-[#FEF9E7] border-[#F6BD60] hover:border-[#457B9D]',
};

const FALLBACK_PASTEL_LIST = [
  'bg-[#EBF5FB] border-[#90CAF9] hover:border-[#457B9D]',
  'bg-[#E8F6F3] border-[#80CBC4] hover:border-[#457B9D]',
  'bg-[#FEF9E7] border-[#FFE082] hover:border-[#457B9D]',
  'bg-[#F5EEF8] border-[#CE93D8] hover:border-[#457B9D]',
];

export default function App() {
  // 3 Clear Screens via Top Navbar
  const [activeScreen, setActiveScreen] = useState<ActiveScreen>('classroom');

  // Database & Dual-Sync State
  const [isSupabaseOnline, setIsSupabaseOnline] = useState<boolean>(false);
  const [childrenList, setChildrenList] = useState<ChildProfile[]>([]);
  const [observations, setObservations] = useState<ObservationRecord[]>([]);
  const [systemEvents, setSystemEvents] = useState<SystemEventRecord[]>([]);
  const [turns, setTurns] = useState<TurnRecord[]>([]);

  // Audio & Speech State
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(() => speechService.getPlaybackRate());

  // Activity & Deterministic State Machine
  const [selectedActivityId, setSelectedActivityId] = useState<ActivityId>('greeting');
  const [selectedVariationId, setSelectedVariationId] = useState<string>('تحية الصباح');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [systemState, setSystemState] = useState<SystemState>('WAITING');

  // Participating Children & Turn Rotation
  const [currentTurnIndex, setCurrentTurnIndex] = useState<number>(0);
  const [currentSessionId, setCurrentSessionId] = useState<string>(`SES-${Date.now().toString().slice(-5)}`);
  const [currentTurnId, setCurrentTurnId] = useState<string>(`TRN-${Date.now().toString().slice(-5)}`);

  // Current Prompt, Before/After Gemini Simplification, Scientific Rationale, and Card Selection
  const [currentPromptText, setCurrentPromptText] = useState<string>(
    'صَبَاحُ الخَيْرِ يَا أَصْدِقَاءْ، أَهْلاً بِكُمْ فِي القِسْمْ.'
  );
  const [originalPromptBeforeAI, setOriginalPromptBeforeAI] = useState<string | null>(null);
  const [scientificRationale, setScientificRationale] = useState<string | null>(null);
  const [promptSource, setPromptSource] = useState<PromptSource>('static');
  const [currentSupportLevel, setCurrentSupportLevel] = useState<SupportLevel>('مستقل');
  const [visualHintActive, setVisualHintActive] = useState<boolean>(false);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [isSimplifying, setIsSimplifying] = useState<boolean>(false);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  // Silent Reference Wait Timer
  const [waitElapsedSec, setWaitElapsedSec] = useState<number>(0);
  const waitIntervalRef = useRef<number | null>(null);

  // Response Logging Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [modalDefaultResponse, setModalDefaultResponse] = useState<ResponseType>('اختيار صورة');

  // Derived Curriculum Objects
  const currentActivity =
    ACTIVITIES_CURRICULUM.find((a) => a.id === selectedActivityId) || ACTIVITIES_CURRICULUM[0];
  const currentVariation =
    currentActivity.variations.find((v) => v.variationId === selectedVariationId) ||
    currentActivity.variations[0];
  const currentStep =
    currentVariation.steps[currentStepIndex] || currentVariation.steps[0];

  const currentChild: ChildProfile | null =
    childrenList[currentTurnIndex] || childrenList[0] || null;

  const nextChild: ChildProfile | null =
    childrenList.length > 1
      ? childrenList[(currentTurnIndex + 1) % childrenList.length]
      : null;

  // Initial Data Load & Supabase Dual-Sync Subscription
  useEffect(() => {
    const unsubDb = db.subscribeStatus((online) => {
      setIsSupabaseOnline(online);
    });

    const unsubSpeech = speechService.onAudioStateChange(({ isSpeaking: speaking, isLoading: loading }) => {
      setIsSpeaking(speaking);
      setIsLoadingAudio(loading);
    });

    (async () => {
      await db.checkConnectionAndSync();
      const loadedChildren = await db.getChildren();
      setChildrenList(loadedChildren);

      const [loadedObs, loadedEvts, loadedTurns] = await Promise.all([
        db.getObservations(),
        db.getSystemEvents(),
        db.getTurns(),
      ]);
      setObservations(loadedObs);
      setSystemEvents(loadedEvts);
      setTurns(loadedTurns);
    })();

    return () => {
      unsubDb();
      unsubSpeech();
    };
  }, []);

  // Silent Reference Wait Counter
  useEffect(() => {
    if (waitIntervalRef.current) {
      window.clearInterval(waitIntervalRef.current);
    }

    if (activeScreen === 'classroom' && systemState === 'WAITING') {
      waitIntervalRef.current = window.setInterval(() => {
        setWaitElapsedSec((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (waitIntervalRef.current) {
        window.clearInterval(waitIntervalRef.current);
      }
    };
  }, [activeScreen, systemState, currentStepIndex, currentTurnIndex]);

  // Apply Step Defaults
  const applyStepDefaults = (
    activityId: ActivityId,
    variationId: string,
    stepIdx: number,
    speakNow = true
  ) => {
    const act = ACTIVITIES_CURRICULUM.find((a) => a.id === activityId) || ACTIVITIES_CURRICULUM[0];
    const vari = act.variations.find((v) => v.variationId === variationId) || act.variations[0];
    const stp = vari.steps[stepIdx] || vari.steps[0];

    setCurrentPromptText(stp.defaultPrompt);
    setOriginalPromptBeforeAI(null);
    setScientificRationale(null);
    setPromptSource('static');
    setCurrentSupportLevel('مستقل');
    setVisualHintActive(false);
    setSelectedCardId(null);
    setWaitElapsedSec(0);
    setCurrentTurnId(`TRN-${Date.now().toString().slice(-5)}`);
    setStatusToast(null);

    if (stp.isClosingStep) {
      setSystemState('COMPLETED');
    } else {
      setSystemState('PRESENTING');
    }

    if (speakNow && !isMuted) {
      speechService.speak(stp.defaultPrompt, () => {
        setSystemState(stp.isClosingStep ? 'COMPLETED' : 'WAITING');
      });
    } else {
      setSystemState(stp.isClosingStep ? 'COMPLETED' : 'WAITING');
    }
  };

  // Switch Activity or Variation
  const handleSelectActivity = async (activityId: ActivityId, variationId?: string) => {
    const act = ACTIVITIES_CURRICULUM.find((a) => a.id === activityId) || ACTIVITIES_CURRICULUM[0];
    const defaultVar = variationId || act.variations[0].variationId;
    const newSessionId = `SES-${Date.now().toString().slice(-5)}`;

    setSelectedActivityId(activityId);
    setSelectedVariationId(defaultVar);
    setCurrentStepIndex(0);
    setCurrentSessionId(newSessionId);

    applyStepDefaults(activityId, defaultVar, 0, true);

    const newSession: SessionRecord = {
      session_id: newSessionId,
      activity_id: activityId,
      variation: defaultVar,
      participating_children: childrenList.map((c) => c.child_id),
      status: 'active',
      started_at: new Date().toISOString(),
    };
    await db.saveSession(newSession);

    const updatedEvents = await db.logSystemEvent({
      session_id: newSessionId,
      activity_id: activityId,
      step_id: 1,
      event_type: 'SESSION_START',
      model_status: 'static_used',
      details: `بدء نشاط (${act.title} — ${defaultVar})`,
    });
    setSystemEvents(updatedEvents);
  };

  // Instant Emergency Stop ("🛑 إيقاف فوري للصوت")
  const handleEmergencyStop = async () => {
    speechService.emergencyStop();
    setIsMuted(true);
    speechService.setMuted(true);
    setSystemState('PAUSED');
    setStatusToast('تم إيقاف الصوت فوراً.');

    const updatedEvents = await db.logSystemEvent({
      session_id: currentSessionId,
      activity_id: selectedActivityId,
      step_id: currentStep.step_id,
      event_type: 'EMERGENCY_STOP',
      model_status: 'system_state',
      details: 'إيقاف فوري للصوت من طرف المعلم.',
    });
    setSystemEvents(updatedEvents);
  };

  const handleExplicitSpeak = (text: string) => {
    if (isMuted) {
      setIsMuted(false);
      speechService.setMuted(false);
    }
    speechService.speak(text);
  };

  const handlePlaybackRateChange = (newRate: number) => {
    const applied = speechService.setPlaybackRate(newRate);
    setPlaybackRate(applied);
  };

  // ==================== 4 MAIN TEACHER REMOTE CONTROL ACTIONS ====================

  // Button 1: 🔁 إعادة نطق الجملة
  const handleRepeatPrompt = async () => {
    if (isMuted) {
      setIsMuted(false);
      speechService.setMuted(false);
    }
    setCurrentSupportLevel('إعادة');
    setWaitElapsedSec(0);
    setSystemState('PRESENTING');
    speechService.speak(currentPromptText, () => {
      setSystemState('WAITING');
    });
    setStatusToast('🔁 تمت إعادة نطق الجملة بصوت أسماء الهادئ.');

    const evts = await db.logSystemEvent({
      session_id: currentSessionId,
      activity_id: selectedActivityId,
      step_id: currentStep.step_id,
      event_type: 'PROMPT_REPEAT',
      model_status: promptSource === 'gemini_verified' ? 'gemini_verified' : 'static_used',
      details: `إعادة نطق الجملة للطفل (${currentChild?.alias || '—'}): "${currentPromptText}"`,
    });
    setSystemEvents(evts);
  };

  // Button 2: ✨ تبسيط الجملة بالذكاء الاصطناعي (Gemini) وفق منهج TEACCH & PECS
  const handleSimplifyWithGemini = async () => {
    if (isSimplifying) return;
    if (isMuted) {
      setIsMuted(false);
      speechService.setMuted(false);
    }
    setIsSimplifying(true);
    setCurrentSupportLevel('تبسيط');
    setWaitElapsedSec(0);

    const beforeText = currentStep.defaultPrompt;
    setOriginalPromptBeforeAI(beforeText);

    const childLangLevel = currentChild?.language_level || 1;
    const approvedCardLabels = currentStep.cards.map((c) => c.label);
    const defaultRationale =
      SCIENTIFIC_RATIONALES[selectedActivityId]?.[currentStep.step_id]?.[childLangLevel] ||
      'تم تطبيق منهج TEACCH وPECS: تقليص الحمل المعرفي السمعي إلى كلمات محورية (فعل مباشر + اسم محسوس) مع تسكين أواخر الكلمات للوقف الصوتي الطبيعي.';

    try {
      const response = await fetch('/api/gemini/simplify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          activity_id: selectedActivityId,
          step_id: currentStep.step_id,
          language_level: childLangLevel,
          support_type: 'simplify',
          current_prompt: beforeText,
          approved_cards_list: approvedCardLabels,
        }),
      });

      const data = await response.json();
      const candidateText = data.simplified_text || data.text || '';
      const candidateRationale = data.scientific_rationale || defaultRationale;
      const clientValidation = validateOutput(candidateText);

      let finalPrompt = candidateText;
      let finalRationale = candidateRationale;
      let finalSource: PromptSource =
        data.source === 'gemini_verified' ? 'gemini_verified' : 'fallback_safe';
      let finalStatus: SystemEventRecord['model_status'] =
        data.model_status || 'fallback_used';

      if (!clientValidation.valid) {
        finalPrompt =
          currentStep.SimplifiedFallbacks[childLangLevel] ||
          FALLBACK_PROMPTS[selectedActivityId]?.[currentStep.step_id]?.[childLangLevel] ||
          beforeText;
        finalRationale = defaultRationale;
        finalSource = 'fallback_safe';
        finalStatus = 'fallback_used';
      }

      setCurrentPromptText(finalPrompt);
      setScientificRationale(finalRationale);
      setPromptSource(finalSource);
      setSystemState('PRESENTING');
      speechService.speak(finalPrompt, () => {
        setSystemState('WAITING');
      });

      setStatusToast(
        `✨ تم تطبيق التبسيط العلمي (TEACCH / PECS) للمستوى اللغوي (${childLangLevel}) للطفل ${currentChild?.alias || ''}.`
      );

      const evts = await db.logSystemEvent({
        session_id: currentSessionId,
        activity_id: selectedActivityId,
        step_id: currentStep.step_id,
        event_type: 'PROMPT_SIMPLIFY',
        model_status: finalStatus,
        details: `تبسيط TEACCH/PECS (مستوى ${childLangLevel}): "${finalPrompt}" — التبرير العلمي: ${finalRationale}`,
      });
      setSystemEvents(evts);
    } catch {
      const fallbackPrompt =
        currentStep.SimplifiedFallbacks[childLangLevel] ||
        FALLBACK_PROMPTS[selectedActivityId]?.[currentStep.step_id]?.[childLangLevel] ||
        beforeText;

      setCurrentPromptText(fallbackPrompt);
      setScientificRationale(defaultRationale);
      setPromptSource('fallback_safe');
      setSystemState('PRESENTING');
      speechService.speak(fallbackPrompt, () => {
        setSystemState('WAITING');
      });
      setStatusToast(`✨ تم تطبيق التبسيط المعتمد (TEACCH / PECS) للمستوى ${childLangLevel}.`);
    } finally {
      setIsSimplifying(false);
    }
  };

  // Button 3: 📝 تسجيل كيف تفاعل الطفل
  const handleOpenLogModal = () => {
    setModalDefaultResponse(selectedCardId ? 'اختيار صورة' : 'كلام');
    setIsLogModalOpen(true);
  };

  // Button 4: ➡️ الانتقال للخطوة التالية / الطفل التالي
  const handleNextStepOrChild = async () => {
    if (currentStepIndex < currentVariation.steps.length - 1) {
      const nextStepIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextStepIdx);
      applyStepDefaults(selectedActivityId, selectedVariationId, nextStepIdx, true);

      const evts = await db.logSystemEvent({
        session_id: currentSessionId,
        activity_id: selectedActivityId,
        step_id: currentVariation.steps[nextStepIdx].step_id,
        event_type: 'STEP_CHANGE',
        model_status: 'static_used',
        details: `انتقال إلى الخطوة ${currentVariation.steps[nextStepIdx].step_id}: ${currentVariation.steps[nextStepIdx].title}`,
      });
      setSystemEvents(evts);
    } else {
      // Completed all steps for current child -> rotate to next child and restart at Step 1
      const nextChildIdx = childrenList.length > 0 ? (currentTurnIndex + 1) % childrenList.length : 0;
      const nextParticipant = childrenList[nextChildIdx];
      setCurrentTurnIndex(nextChildIdx);
      setCurrentStepIndex(0);
      applyStepDefaults(selectedActivityId, selectedVariationId, 0, true);
      if (nextParticipant) {
        setStatusToast(
          `🎉 أحسنتم! انتقل الدور الآن إلى الطفل التالي: ${nextParticipant.avatar_symbol} ${nextParticipant.alias}`
        );
      }
    }
  };

  // Rotate Child Directly
  const handleSwitchChildTurn = (index: number) => {
    if (index < 0 || index >= childrenList.length) return;
    const target = childrenList[index];
    setCurrentTurnIndex(index);
    setWaitElapsedSec(0);
    setSelectedCardId(null);
    setOriginalPromptBeforeAI(null);
    setScientificRationale(null);
    setCurrentPromptText(currentStep.defaultPrompt);
    setCurrentTurnId(`TRN-${Date.now().toString().slice(-5)}`);
    setStatusToast(`الآن دور الطفل: ${target.avatar_symbol} ${target.alias}`);
    if (!isMuted) {
      speechService.speak(`الآنَ دَوْرُ ${target.alias}. ${currentStep.defaultPrompt}`);
    }
  };

  // Child Card Click Handler
  const handleChildCardClick = async (card: VisualCard) => {
    setSelectedCardId(card.id);
    handleExplicitSpeak(card.spokenText);
    setStatusToast(
      `👏 نقر الطفل (${currentChild?.alias || ''}) على بطاقة PECS "${card.label}". اضغط على (📝 تسجيل كيف تفاعل الطفل) لحفظها.`
    );

    const evts = await db.logSystemEvent({
      session_id: currentSessionId,
      activity_id: selectedActivityId,
      step_id: currentStep.step_id,
      event_type: 'CARD_CLICKED',
      model_status: 'system_state',
      details: `اختار الطفل (${currentChild?.alias || '—'}) بطاقة PECS: (${card.label})`,
    });
    setSystemEvents(evts);
  };

  // Save Teacher Observation & Turn Log
  const handleSaveTeacherLog = async (formData: {
    response_type: ResponseType;
    initiation_type: InitiationType;
    support_level: SupportLevel;
    interaction_partner: InteractionPartner;
    peer_cooperation: boolean | null;
    note_text: string;
  }) => {
    const selectedCardObj = currentStep.cards.find((c) => c.id === selectedCardId);
    const childAliasDisplay = currentChild
      ? `${currentChild.avatar_symbol} ${currentChild.alias}`
      : 'طفل غير محدد';

    const newTurn: TurnRecord = {
      turn_id: currentTurnId,
      session_id: currentSessionId,
      child_id: currentChild?.child_id || 'CH-101',
      child_alias: childAliasDisplay,
      activity_id: selectedActivityId,
      variation: selectedVariationId,
      step_id: currentStep.step_id,
      prompt_text: currentPromptText,
      prompt_source: promptSource,
      response_type: formData.response_type,
      initiation_type: formData.initiation_type,
      support_level: formData.support_level,
      interaction_partner: formData.interaction_partner,
      peer_cooperation: formData.peer_cooperation,
      selected_card_label: selectedCardObj?.label || null,
      wait_elapsed_sec: waitElapsedSec,
      recorded_by: 'teacher',
      created_at: new Date().toISOString(),
    };

    const newObs: ObservationRecord = {
      observation_id: `OBS-${Date.now().toString().slice(-5)}`,
      session_id: currentSessionId,
      turn_id: currentTurnId,
      child_id: currentChild?.child_id || 'CH-101',
      child_alias: childAliasDisplay,
      activity_id: selectedActivityId,
      step_id: currentStep.step_id,
      response_type: formData.response_type,
      initiation_type: formData.initiation_type,
      support_level: formData.support_level,
      interaction_partner: formData.interaction_partner,
      peer_cooperation: formData.peer_cooperation,
      note_text: formData.note_text,
      source: 'teacher',
      recorded_by: 'teacher',
      edit_history: [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    await db.insertTurn(newTurn);
    const updatedObs = await db.insertObservation(newObs);
    const updatedTurns = await db.getTurns();
    setObservations(updatedObs);
    setTurns(updatedTurns);
    setStatusToast(
      `✅ تم حفظ تفاعل (${childAliasDisplay}) في قاعدة البيانات بنجاح! يمكنك الآن الضغط على (➡️ التالي).`
    );
  };

  // Step-by-Step Teacher Guidance Text
  const getTeacherGuideMessage = (): string => {
    const stepNum = currentStep.step_id;
    const totalSteps = currentVariation.steps.length;
    const childName = currentChild ? `${currentChild.avatar_symbol} ${currentChild.alias}` : 'الطفل';

    if (currentStep.isClosingStep) {
      return `الخطوة ${stepNum} من ${totalSteps} (ختام النشاط): شجع ${childName} على المشاركة الهادئة، ثم اضغط على «📝 تسجيل كيف تفاعل الطفل» أو «➡️ الانتقال للطفل التالي».`;
    }
    return `الخطوة ${stepNum} من ${totalSteps}: اطلب من (${childName}) النظر للشاشة والاستماع لـ "أسماء". إذا لم يستجب اضغط على زر «✨ تبسيط لغوي (Gemini)»، ثم «📝 سجل استجابته» واضغط «➡️ التالي».`;
  };

  const displayedCards = currentStep.cards;

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F9F9] text-[#1D3557]" dir="rtl">
      {/* ==================== SIMPLE 3-SCREEN TOP NAVBAR ==================== */}
      <header className="flex items-center justify-between gap-6 px-4 sm:px-8 py-3.5 bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
        {/* Zone 1: Brand Title */}
        <button
          type="button"
          onClick={() => setActiveScreen('classroom')}
          className="text-lg sm:text-xl font-bold tracking-tight text-[#1D3557] whitespace-nowrap shrink-0 font-display"
        >
          👩‍🏫 أسماء | ASMAE
        </button>

        {/* Zone 2: 3 Clear Screen Tabs */}
        <nav className="flex items-center gap-2 sm:gap-4 text-sm font-bold">
          <button
            type="button"
            onClick={() => setActiveScreen('classroom')}
            className={`px-3.5 py-2 rounded-xl calm-transition whitespace-nowrap shrink-0 ${
              activeScreen === 'classroom'
                ? 'bg-[#1D3557] text-white'
                : 'text-slate-600 hover:bg-[#D8E2DC]/50 hover:text-[#1D3557]'
            }`}
          >
            1. قاعة النشاط الصفي
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('children')}
            className={`px-3.5 py-2 rounded-xl calm-transition whitespace-nowrap shrink-0 ${
              activeScreen === 'children'
                ? 'bg-[#1D3557] text-white'
                : 'text-slate-600 hover:bg-[#D8E2DC]/50 hover:text-[#1D3557]'
            }`}
          >
            2. إدارة الأطفال ({childrenList.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveScreen('reports')}
            className={`px-3.5 py-2 rounded-xl calm-transition whitespace-nowrap shrink-0 ${
              activeScreen === 'reports'
                ? 'bg-[#1D3557] text-white'
                : 'text-slate-600 hover:bg-[#D8E2DC]/50 hover:text-[#1D3557]'
            }`}
          >
            3. التقارير وملف Excel ({observations.length})
          </button>
        </nav>

        {/* Zone 3: Emergency Stop Button */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleEmergencyStop}
            className="py-2 px-3.5 rounded-xl bg-red-700 text-white text-xs font-bold hover:bg-red-800 calm-transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
            title="إيقاف فوري للصوت"
          >
            <OctagonAlert className="w-4 h-4" />
            <span className="hidden sm:inline">🛑 إيقاف الصوت</span>
          </button>
        </div>
      </header>

      {/* ==================== MAIN CONTENT ==================== */}
      <main className="flex-1">
        {/* ==================== SCREEN 1: قاعة النشاط الصفي ==================== */}
        {activeScreen === 'classroom' && (
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 space-y-5">
            {/* 1. TOP GUIDE BOX FOR TEACHER ("شرح مباشر للمعلم - تلميح إرشادي") */}
            <div className="bg-[#FFFBEB] border-2 border-[#FDE68A] rounded-2xl p-4 sm:p-5 space-y-3 shadow-2xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                    <Lightbulb className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-amber-900">
                      شرح مباشر للمعلم (ماذا تفعل الآن؟) ·{' '}
                      <span>
                        {isSupabaseOnline ? 'متصل بـ Supabase 🟢' : 'وضع محلي Offline 🟡'}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-bold text-[#1D3557] mt-0.5 leading-relaxed">
                      {getTeacherGuideMessage()}
                    </p>
                  </div>
                </div>

                {/* Simple Activity & Variation Selector */}
                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <select
                    aria-label="اختر الوحدة التعليمية"
                    value={selectedActivityId}
                    onChange={(e) => {
                      const actId = e.target.value as ActivityId;
                      const actObj =
                        ACTIVITIES_CURRICULUM.find((a) => a.id === actId) ||
                        ACTIVITIES_CURRICULUM[0];
                      handleSelectActivity(actId, actObj.variations[0].variationId);
                    }}
                    className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-[#1D3557]"
                  >
                    {ACTIVITIES_CURRICULUM.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.iconSymbol} {a.title}
                      </option>
                    ))}
                  </select>

                  <select
                    aria-label="اختر السيناريو"
                    value={selectedVariationId}
                    onChange={(e) => {
                      const vId = e.target.value;
                      setSelectedVariationId(vId);
                      setCurrentStepIndex(0);
                      applyStepDefaults(selectedActivityId, vId, 0, true);
                    }}
                    className="rounded-xl border border-amber-300 bg-white px-3 py-2 text-xs font-bold text-[#1D3557]"
                  >
                    {currentActivity.variations.map((v) => (
                      <option key={v.variationId} value={v.variationId}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* 2. TOP HALF: CHILD VIEW (شاشة الطفل الهادئة والواضحة) */}
            <section
              aria-label="شاشة الطفل"
              className="bg-white rounded-3xl border-2 border-[#D8E2DC] p-6 sm:p-8 shadow-xs space-y-7"
            >
              {/* Clear Turn Badge + Quick Child Switcher Pills */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-5 border-b border-slate-100">
                <div className="flex items-center gap-3 bg-[#D8E2DC]/60 px-5 py-2.5 rounded-2xl border border-[#1D3557]/15">
                  <span className="text-3xl">{currentChild?.avatar_symbol || '🌟'}</span>
                  <div>
                    <span className="text-xs font-bold text-[#457B9D] block">
                      الآن دور الطفل:
                    </span>
                    <span className="text-xl font-bold text-[#1D3557]">
                      {currentChild ? currentChild.alias : 'المجموعة'}
                    </span>
                  </div>
                </div>

                {/* Switch child turn with one click */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">تبديل الطفل:</span>
                  {childrenList.map((child, idx) => (
                    <button
                      key={child.child_id}
                      type="button"
                      onClick={() => handleSwitchChildTurn(idx)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold border calm-transition flex items-center gap-1.5 ${
                        currentTurnIndex === idx
                          ? 'bg-[#1D3557] text-white border-[#1D3557]'
                          : 'bg-[#F7F9F9] text-[#1D3557] border-slate-200 hover:bg-[#D8E2DC]/50'
                      }`}
                    >
                      <span>{child.avatar_symbol}</span>
                      <span>{child.alias}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Character "Asmae" 👩‍🏫 + Giant Speech Bubble + Big Audio Button 🔊 */}
              <div className="flex flex-col md:flex-row items-center justify-center gap-6 sm:gap-8 py-2">
                {/* Large Friendly SVG Avatar for Asmae with Gentle Audio Wave Visualizer */}
                <div className="shrink-0 flex flex-col items-center">
                  <AsmaeAvatar systemState={systemState} isSpeaking={isSpeaking} size="lg" />
                </div>

                {/* Large Speech Bubble */}
                <div className="flex-1 w-full max-w-2xl bg-[#F7F9F9] border-2 border-[#457B9D]/30 rounded-3xl p-6 sm:p-8 text-center md:text-right space-y-5 relative">
                  <div className="text-xs font-bold text-[#457B9D]">
                    👩‍🏫 أسماء تقول ({currentStep.title}):
                  </div>

                  {/* Very Large Spoken Sentence */}
                  <p
                    className="text-3xl sm:text-4xl font-bold text-[#1D3557] leading-snug"
                    style={{ textWrap: 'balance' }}
                  >
                    « {currentPromptText} »
                  </p>

                  {/* SCIENTIFIC RATIONALE & BEFORE/AFTER BOX (TEACCH & PECS Protocol) */}
                  {(scientificRationale ||
                    (originalPromptBeforeAI && originalPromptBeforeAI !== currentPromptText)) && (
                    <div className="bg-white border-2 border-[#52B788]/60 rounded-2xl p-4 text-right space-y-2.5 shadow-2xs">
                      <div className="text-xs sm:text-sm font-bold text-[#1D3557] flex items-center gap-1.5">
                        <span>🧬 الأساس العلمي للتبسيط التوليدي (منهج TEACCH / PECS)</span>
                        <span className="text-xs font-semibold text-[#457B9D]">
                          · المستوى اللغوي ({currentChild?.language_level || 1})
                        </span>
                      </div>

                      {originalPromptBeforeAI && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-[#F7F9F9] p-3 rounded-xl border border-slate-200/80">
                          <div className="text-slate-500">
                            <span className="font-bold block text-slate-600 mb-0.5">
                              الجملة الأصلية قبل التبسيط:
                            </span>
                            <span className="line-through">{originalPromptBeforeAI}</span>
                          </div>
                          <div className="text-emerald-950">
                            <span className="font-bold block text-emerald-800 mb-0.5">
                              الجملة المبسطة (مشكولة مع تسكين الوقف):
                            </span>
                            <span className="font-bold text-sm">{currentPromptText}</span>
                          </div>
                        </div>
                      )}

                      {scientificRationale && (
                        <p className="text-xs sm:text-sm text-[#1D3557] bg-[#E8F6F3]/70 border border-[#52B788]/40 rounded-xl p-3 leading-relaxed font-medium">
                          {scientificRationale}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Big Play Sound Button 🔊 */}
                  <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-3">
                    <button
                      type="button"
                      disabled={isLoadingAudio}
                      onClick={() => handleExplicitSpeak(currentPromptText)}
                      className="py-3.5 px-7 rounded-2xl bg-[#1D3557] text-white text-base sm:text-lg font-bold hover:bg-[#1D3557]/90 disabled:opacity-75 flex items-center gap-3 shadow-xs calm-transition"
                    >
                      <Volume2 className="w-6 h-6" />
                      <span>
                        {isLoadingAudio
                          ? '⏳ جاري تجهيز صوت أسماء...'
                          : isSpeaking
                          ? '🔊 أسماء تتحدث الآن...'
                          : '🔊 تشغيل الصوت بصوت أسماء'}
                      </span>
                    </button>
                    {speechService.isPromptCached(currentPromptText) && !isLoadingAudio && (
                      <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
                        ⚡ محفوظ في الذاكرة المؤقتة (تشغيل فوري)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* High-Clarity PECS Visual Cards */}
              <div className="space-y-4 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-[#1D3557]">
                      بطاقات التواصل البصري (PECS Visual Cards — ينقر الطفل على البطاقة المناسبة):
                    </h3>
                    <p className="text-xs text-slate-500">
                      رسوم توضيحية مسطحة عالية الوضوح مع تغذية بصرية هادئة بدون وميض حسي
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setVisualHintActive(!visualHintActive)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold border calm-transition flex items-center gap-1.5 ${
                      visualHintActive
                        ? 'bg-[#52B788] text-white border-[#52B788]'
                        : 'bg-[#F7F9F9] text-[#457B9D] border-[#457B9D]/30 hover:bg-[#E8F6F3]'
                    }`}
                  >
                    <Eye className="w-4 h-4" />
                    <span>
                      {visualHintActive
                        ? 'إلغاء التلميح البصري (إظهار الكل بنفس السطوع)'
                        : 'تفعيل التلميح البصري (إبراز البطاقة المستهدفة بهدوء)'}
                    </span>
                  </button>
                </div>

                <div
                  className={`grid gap-6 ${
                    displayedCards.length === 1
                      ? 'grid-cols-1 max-w-sm mx-auto'
                      : displayedCards.length === 2
                      ? 'grid-cols-1 sm:grid-cols-2'
                      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                  }`}
                >
                  {displayedCards.map((card, idx) => {
                    const isSelected = selectedCardId === card.id;
                    const isHighlightedByHint = visualHintActive && card.isTarget;
                    const isHighlighted = isSelected || isHighlightedByHint;

                    // Dim non-selected cards gently when a card is selected, or dim non-target cards when visual hint is active
                    const isDimmed =
                      (selectedCardId !== null && !isSelected) ||
                      (visualHintActive && !card.isTarget && !isSelected);

                    const categoryStyle =
                      CARD_PASTEL_STYLES[card.category] ||
                      FALLBACK_PASTEL_LIST[idx % FALLBACK_PASTEL_LIST.length];

                    return (
                      <button
                        key={card.id}
                        type="button"
                        onClick={() => handleChildCardClick(card)}
                        className={`relative p-6 rounded-3xl border-4 flex flex-col items-center justify-between gap-3 text-center min-h-[225px] transition-all duration-500 ${
                          isHighlighted
                            ? 'bg-[#E8F6F3] border-[#52B788] ring-4 ring-[#52B788]/30 shadow-[0_0_25px_rgba(82,183,136,0.35)] scale-105 z-10'
                            : categoryStyle
                        } ${isDimmed ? 'opacity-40 scale-95' : 'opacity-100'}`}
                      >
                        {/* Top PECS Category Strip & Selection Checkmark */}
                        <div className="w-full flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#1D3557]/75 bg-white/80 px-2.5 py-0.5 rounded-lg border border-slate-200/70">
                            بطاقة PECS · {card.category}
                          </span>
                          {isSelected && (
                            <span
                              className="text-xl leading-none bg-white rounded-full p-1 shadow-2xs"
                              aria-label="تم الاختيار"
                            >
                              ✅
                            </span>
                          )}
                        </div>

                        {/* Large High-Clarity Custom SVG Illustration */}
                        <div className="my-1 flex items-center justify-center">
                          <PecsCardIllustration card={card} />
                        </div>

                        {/* Extra Bold Clear Label */}
                        <div className="space-y-1 w-full">
                          <span className="block text-2xl sm:text-[26px] font-extrabold text-[#1D3557] tracking-tight leading-snug">
                            {card.label}
                          </span>
                          {isSelected && (
                            <span className="inline-block text-xs font-bold text-emerald-900 bg-[#52B788]/25 border border-[#52B788] px-3 py-0.5 rounded-lg">
                              ✅ تم اختيار البطاقة
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 3. BOTTOM HALF: TEACHER REMOTE CONTROL (جهاز تحكم المعلم - 4 أزرار واضحة + التحكم في سرعة الصوت) */}
            <section
              aria-label="جهاز تحكم المعلم"
              className="bg-white rounded-3xl border-2 border-slate-200 p-5 sm:p-6 shadow-xs space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-[#1D3557]">
                    🎛️ جهاز تحكم المعلم (Remote Control)
                  </h2>
                  <span className="text-xs text-slate-500 font-mono-num">
                    · زمن الانتظار الهادئ: {waitElapsedSec} ثانية
                  </span>
                </div>

                {/* Teacher Audio Speed Slider (0.70x very slow to 1.00x normal, default 0.88x) */}
                <div className="flex items-center gap-3 bg-[#F7F9F9] border border-slate-200 px-3.5 py-2 rounded-2xl">
                  <Gauge className="w-4 h-4 text-[#457B9D] shrink-0" />
                  <label
                    htmlFor="teacher-speed-slider"
                    className="text-xs font-bold text-[#1D3557] whitespace-nowrap"
                  >
                    سرعة نطق أسماء ({playbackRate.toFixed(2)}x):
                  </label>
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">بطيء جداً 0.70x</span>
                  <input
                    id="teacher-speed-slider"
                    type="range"
                    min="0.70"
                    max="1.00"
                    step="0.02"
                    value={playbackRate}
                    onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                    className="w-24 sm:w-28 accent-[#1D3557] cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-500 whitespace-nowrap">عادي 1.0x</span>
                </div>
              </div>

              {statusToast && (
                <div className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-xl">
                  {statusToast}
                </div>
              )}

              {/* The 4 Clear, Self-Explanatory Teacher Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* 1. 🔁 إعادة نطق الجملة */}
                <button
                  type="button"
                  disabled={isLoadingAudio}
                  onClick={handleRepeatPrompt}
                  className="p-4 rounded-2xl border-2 border-slate-200 bg-[#F7F9F9] hover:bg-[#D8E2DC]/60 hover:border-[#1D3557] disabled:opacity-70 text-right flex flex-col justify-between gap-2 calm-transition"
                >
                  <div className="text-base font-bold text-[#1D3557]">
                    {isLoadingAudio ? '⏳ جاري تجهيز صوت أسماء...' : '🔁 إعادة نطق الجملة'}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    تكرار الجملة المشكولة مع وقفات تنفس هادئة وبسرعة متأنية ({playbackRate.toFixed(2)}x).
                  </p>
                </button>

                {/* 2. ✨ تبسيط لغوي (Gemini) وفق منهج TEACCH & PECS */}
                <button
                  type="button"
                  onClick={handleSimplifyWithGemini}
                  disabled={isSimplifying}
                  className="p-4 rounded-2xl border-2 border-[#457B9D] bg-[#EBF5FB]/60 hover:bg-[#EBF5FB] text-right flex flex-col justify-between gap-2 calm-transition"
                >
                  <div className="text-base font-bold text-[#1D3557]">
                    {isSimplifying
                      ? '⏳ جاري تطبيق بروتوكول TEACCH...'
                      : '✨ تبسيط لغوي (Gemini — TEACCH & PECS)'}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    تقليص الجملة إلى كلمات محورية للمستوى ({currentChild?.language_level || 1}) مع إظهار التفسير العلمي.
                  </p>
                </button>

                {/* 3. 📝 تسجيل كيف تفاعل الطفل */}
                <button
                  type="button"
                  onClick={handleOpenLogModal}
                  className="p-4 rounded-2xl border-2 border-emerald-600 bg-emerald-50/70 hover:bg-emerald-100/80 text-right flex flex-col justify-between gap-2 calm-transition"
                >
                  <div className="text-base font-bold text-emerald-950">
                    📝 تسجيل كيف تفاعل الطفل
                  </div>
                  <p className="text-xs text-emerald-900/80 leading-relaxed">
                    هل تكلم؟ هل أشار؟ هل اختار بطاقة PECS؟ وحفظها مباشرة في Supabase.
                  </p>
                </button>

                {/* 4. ➡️ الانتقال للخطوة التالية / الطفل التالي */}
                <button
                  type="button"
                  onClick={handleNextStepOrChild}
                  className="p-4 rounded-2xl bg-[#1D3557] hover:bg-[#1D3557]/90 text-white text-right flex flex-col justify-between gap-2 calm-transition"
                >
                  <div className="text-base font-bold">
                    ➡️ الانتقال للخطوة التالية / الطفل التالي
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {currentStepIndex < currentVariation.steps.length - 1
                      ? `الانتقال إلى الخطوة ${currentStepIndex + 2} من ${currentVariation.steps.length}`
                      : `إتمام الدور والانتقال للطفل التالي (${nextChild?.alias || ''})`}
                  </p>
                </button>
              </div>

              {/* Step Progress Dots & Reset Option */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>خطوات النشاط:</span>
                  {currentVariation.steps.map((s, idx) => (
                    <button
                      key={s.step_id}
                      type="button"
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        applyStepDefaults(selectedActivityId, selectedVariationId, idx, true);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold calm-transition ${
                        currentStepIndex === idx
                          ? 'bg-[#1D3557] text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      خطوة {s.step_id}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentStepIndex(0);
                    applyStepDefaults(selectedActivityId, selectedVariationId, 0, true);
                  }}
                  className="hover:text-[#1D3557] flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>إعادة النشاط من الخطوة 1</span>
                </button>
              </div>
            </section>
          </div>
        )}

        {/* ==================== SCREEN 2: إدارة الأطفال ==================== */}
        {activeScreen === 'children' && (
          <ProfilesAndSettingsView
            childrenList={childrenList}
            onSaveChild={async (child) => {
              const updated = await db.upsertChild(child);
              setChildrenList(updated);
            }}
            onDeleteChild={async (child_id) => {
              const updated = await db.deleteChild(child_id);
              setChildrenList(updated);
            }}
            onExportBackup={() => db.exportFullBackupJSON()}
            onImportBackup={async (json) => {
              const ok = db.importFullBackupJSON(json);
              if (ok) {
                const [c, o, e, t] = await Promise.all([
                  db.getChildren(),
                  db.getObservations(),
                  db.getSystemEvents(),
                  db.getTurns(),
                ]);
                setChildrenList(c);
                setObservations(o);
                setSystemEvents(e);
                setTurns(t);
              }
              return ok;
            }}
            onLogSafetyTest={async (sampleText: string, result: ValidationResult) => {
              const updated = await db.logSystemEvent({
                session_id: currentSessionId,
                activity_id: selectedActivityId,
                step_id: currentStep.step_id,
                event_type: 'SAFETY_FILTER_TEST',
                model_status: result.valid ? 'gemini_verified' : 'rejected_by_filter',
                details: `اختبار فلتر الأمان للنص "${sampleText.slice(0, 50)}": ${
                  result.valid ? 'مقبول' : `مرفوض (${result.rejectedReason})`
                }`,
              });
              setSystemEvents(updated);
            }}
          />
        )}

        {/* ==================== SCREEN 3: التقارير وملف Excel ==================== */}
        {activeScreen === 'reports' && (
          <LogsAndExportView
            observations={observations}
            systemEvents={systemEvents}
            turns={turns}
            onUpdateObservation={async (id, updates) => {
              const updated = await db.updateObservation(id, updates);
              setObservations(updated);
            }}
            onDeleteObservation={async (id) => {
              const updated = await db.deleteObservation(id);
              setObservations(updated);
            }}
            onDeleteSystemEvent={async (id) => {
              const updated = await db.deleteSystemEvent(id);
              setSystemEvents(updated);
            }}
            onOpenNewObservationModal={() => {
              setModalDefaultResponse('كلام');
              setIsLogModalOpen(true);
            }}
          />
        )}
      </main>

      {/* ==================== MODAL: تسجيل كيف تفاعل الطفل ==================== */}
      <ResponseLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        sessionId={currentSessionId}
        turnId={currentTurnId}
        activityId={selectedActivityId}
        variation={selectedVariationId}
        stepId={currentStep.step_id}
        currentChild={currentChild}
        defaultResponseType={modalDefaultResponse}
        defaultSupportLevel={currentSupportLevel}
        defaultInteractionPartner={
          currentStep.requiresPeerCooperationCheck || currentStep.step_id === 3
            ? 'زميل فعلي'
            : 'أسماء'
        }
        selectedCardLabel={
          currentStep.cards.find((c) => c.id === selectedCardId)?.label || null
        }
        waitElapsedSec={waitElapsedSec}
        requiresPeerCooperation={currentStep.requiresPeerCooperationCheck}
        onSaveLog={handleSaveTeacherLog}
      />
    </div>
  );
}
