import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { FALLBACK_PROMPTS, SCIENTIFIC_RATIONALES, validateOutput } from './src/data/curriculum';
import { ActivityId, LanguageLevel } from './src/types';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function generateConstrainedArabicPrompt(params: {
  activity_id: ActivityId;
  step_id: number;
  language_level: LanguageLevel;
  support_type: 'simplify' | 'variation';
  current_prompt: string;
  approved_cards_list: string[];
}): Promise<{
  text: string;
  simplified_text: string;
  scientific_rationale: string;
  source: 'gemini_verified' | 'fallback_safe';
  model_status: 'gemini_verified' | 'fallback_used' | 'rejected_by_filter';
  raw_output?: string;
  validation_reason?: string;
}> {
  const fallbackText =
    FALLBACK_PROMPTS[params.activity_id]?.[params.step_id]?.[params.language_level] ||
    params.current_prompt;

  const fallbackRationale =
    SCIENTIFIC_RATIONALES[params.activity_id]?.[params.step_id]?.[params.language_level] ||
    'تم تطبيق منهج TEACCH وPECS: تقليص الحمل المعرفي السمعي إلى كلمات محورية (فعل مباشر + اسم محسوس) مع تسكين أواخر الكلمات وحذف الزوائد اللفظية لتسهيل المعالجة السمعية والربط البصري.';

  const ai = getGenAIClient();
  if (!ai) {
    return {
      text: fallbackText,
      simplified_text: fallbackText,
      scientific_rationale: fallbackRationale,
      source: 'fallback_safe',
      model_status: 'fallback_used',
      validation_reason: 'تم استخدام النص الاحتياطي المعتمد وفق بروتوكول TEACCH / PECS.',
    };
  }

  const levelDescriptions: Record<LanguageLevel, string> = {
    1: 'المستوى اللغوي 1 (مبدأ الكلمات المحورية Core Vocabulary: كلمتان إلى 3 كلمات فقط: فعل مباشر + اسم محسوس، أو أداة استفهام + شيء مرئي)',
    2: 'المستوى اللغوي 2 (متوسط البساطة المهيكل: جملة قصيرة من 4 إلى 6 كلمات واضحة وحرفية بدون حشو)',
    3: 'المستوى اللغوي 3 (طبيعي مهيكل: جملة أو جملتان قصيرتان بحد أقصى 10 كلمات بلغة عربية فصحى ميسرة ومباشرة)',
  };

  const combinedConstrainedPrompt = `أنتِ "أسماء"، خبيرة التربية الخاصة وتخاطب أطفال طيف التوحد (6-12 سنة) وفق منهجي TEACCH و PECS.
المطلوب: تطبيق بروتوكول التبسيط اللغوي العلاجي/التربوي الخاص باضطراب طيف التوحد (ASD Pedagogical Protocol) على التعليمة الصفية التالية:

قواعد البروتوكول العلمي (TEACCH & PECS):
1. مبدأ الكلمات المحورية (Core Vocabulary / Keyword Leveling): تقليص الجملة إلى (فعل مباشر + اسم محسوس) أو (أداة استفهام مباشرة + شيء مرئي من البطاقات).
2. إزالة التجريد والمجاز والضمائر الغامضة: استخدام لغة حرفية ومباشرة 100%.
3. التشكيل النحوي الكامل والتسكين الصوتي في أواخر الكلمات: ضبط جميع الحروف بالحركات ووضع السكون (ْ) على الحرف الأخير من كل جملة للوقف السليم دون تنوين آلي مزعج.
4. الحد الأقصى: جملة واحدة أو جملتان قصيرتان (أقل من 10 كلمات).
5. يُمنع منعاً باتاً استخدام أي كلمات طبية أو تشخيصية أو تقييمية أو شخصية مثل: (توحد، مرض، علاج، تشخيص، فشل، خطأ، سيء، درجة، عائلتك، أبوك، أمك).

بيانات الموقف الصفي:
- النشاط: ${params.activity_id}
- الخطوة: ${params.step_id}
- المستوى اللغوي للطفل: ${levelDescriptions[params.language_level]}
- التعليمة الأصلية: "${params.current_prompt}"
- البطاقات البصرية المعروضة (PECS): (${params.approved_cards_list.join('، ')})
- الصياغة المرجعية المعتمدة لهذا المستوى: "${fallbackText}"

أرجعي النتيجة بصيغة JSON فقط بدون أي نص خارجي أو علامات markdown، تحتوي على الحقلين التاليين:
{
  "simplified_text": "الجملة المبسطة المشكولة تشكيلاً كاملاً مع تسكين الآخر (ْ)",
  "scientific_rationale": "شرح علمي وأكاديمي قصير للمعلم يوضح كيف تم تطبيق منهج TEACCH و PECS في تبسيط هذه الجملة (مثلاً: تقليص الحمل المعرفي السمعي إلى كلمتين محوريتين: فعل + اسم محسوس، وحذف المجاز وحروف الجر الزائدة مع تسكين الوقف)."
}`;

  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-3.8-flash',
    'gemini-flash-latest',
    'gemini-3.1-flash-lite',
  ];

  let lastErrorMsg = '';

  for (const modelName of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: combinedConstrainedPrompt,
      });

      const rawText = (response.text || '').trim();
      if (!rawText) continue;

      let parsedSimplified = '';
      let parsedRationale = '';

      // Extract JSON object if present
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsedObj = JSON.parse(jsonMatch[0]);
          if (typeof parsedObj.simplified_text === 'string') {
            parsedSimplified = parsedObj.simplified_text.trim();
          }
          if (typeof parsedObj.scientific_rationale === 'string') {
            parsedRationale = parsedObj.scientific_rationale.trim();
          }
        } catch {
          // If JSON parse fails, fallback to treating rawText as text
        }
      }

      if (!parsedSimplified) {
        parsedSimplified = rawText;
      }
      if (!parsedRationale) {
        parsedRationale = fallbackRationale;
      }

      const validation = validateOutput(parsedSimplified);

      if (validation.valid) {
        return {
          text: validation.cleanedText,
          simplified_text: validation.cleanedText,
          scientific_rationale: parsedRationale,
          source: 'gemini_verified',
          model_status: 'gemini_verified',
          raw_output: rawText,
        };
      } else {
        return {
          text: fallbackText,
          simplified_text: fallbackText,
          scientific_rationale: fallbackRationale,
          source: 'fallback_safe',
          model_status: 'rejected_by_filter',
          raw_output: rawText,
          validation_reason: validation.rejectedReason,
        };
      }
    } catch (err: unknown) {
      lastErrorMsg = err instanceof Error ? err.message : String(err);
      continue;
    }
  }

  return {
    text: fallbackText,
    simplified_text: fallbackText,
    scientific_rationale: fallbackRationale,
    source: 'fallback_safe',
    model_status: 'fallback_used',
    validation_reason: lastErrorMsg
      ? `تم تفعيل النص التربوي المعتمد للمستوى ${params.language_level} وفق منهج TEACCH / PECS.`
      : 'تم تفعيل النص الاحتياطي الآمن تلقائياً.',
  };
}

app.post('/api/gemini/simplify', async (req, res) => {
  try {
    const {
      activity_id = 'greeting',
      step_id = 1,
      language_level = 1,
      support_type = 'simplify',
      current_prompt = 'صَبَاحُ الخَيْرِ، يَا أَصْدِقَاءْ.',
      approved_cards_list = [],
    } = req.body || {};

    const result = await generateConstrainedArabicPrompt({
      activity_id,
      step_id: Number(step_id) || 1,
      language_level: ([1, 2, 3].includes(Number(language_level)) ? Number(language_level) : 1) as LanguageLevel,
      support_type,
      current_prompt,
      approved_cards_list: Array.isArray(approved_cards_list) ? approved_cards_list : [],
    });

    res.json(result);
  } catch (error) {
    const fallback = FALLBACK_PROMPTS.greeting[1][1];
    const fallbackRationale = SCIENTIFIC_RATIONALES.greeting[1][1];
    res.json({
      text: fallback,
      simplified_text: fallback,
      scientific_rationale: fallbackRationale,
      source: 'fallback_safe',
      model_status: 'fallback_used',
      validation_reason: error instanceof Error ? error.message : 'خطأ غير متوقع، تم استخدام النص الاحتياطي.',
    });
  }
});

app.post('/api/gemini/test-safety', async (req, res) => {
  const { sampleText } = req.body || {};
  const validation = validateOutput(String(sampleText || ''));
  res.json(validation);
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`ASMAE EDU-INCLUSION Server running on http://0.0.0.0:${PORT}`);
    });
  } else {
    const vitePromise = createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (err) {
        next(err);
      }
    });

    // Bind port 3000 immediately so health checks succeed without delay
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`ASMAE EDU-INCLUSION Server running on http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();
