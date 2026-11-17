# قوالب ألعاب English Fun — للرفع على الموقع

## الملفات
- `index.html` — صفحة القائمة (Hub) تربط جميع الألعاب
- `match.html`, `hit.html`, `fill.html`, `memory.html`, `scramble.html`, `hangman.html`, `quiz.html`, `typing.html` — كل لعبة مستقلة
- `custom.html` — ألعاب مع رفع ملف Excel (مفرداتك الخاصة)
- `excel-template.xlsx` — قالب Excel (أوراق: Vocabulary, Sentences, Quiz)

## طريقة الرفع
1. ارفع **جميع** ملفات مجلد `templates/` إلى نفس مجلد على الخادم (مثلاً `/games/`).
2. افتح `https://yoursite.com/games/index.html` للقائمة، أو `.../games/match.html` للعبة محددة.

## رفع المفردات (للمدير فقط) — دعم مراحل متعددة
- ادخل `admin.html` (كلمة المرور الافتراضية: `admin123`).
- ارفع Excel — اسم المرحلة يُشتق تلقائياً من اسم الملف (قابل للتعديل).
- حمّل ومعاينة.
- انقر "توليد game-data-<slug>.js" → يُنزَّل ملف بيانات لهذه المرحلة (ويُسجَّل في localStorage).
- انقر "توليد stages.js" → يُنزَّل ملف registry يسرد جميع المراحل.
- ارفع جميع ملفات `game-data-*.js` + `stages.js` إلى مجلد الألعاب.
- إذا لم يُرفع `game-data-<slug>.js` لمرحلة ما، تُستخدم بيانات `game-data.js` (fallback) — الألعاب تبقى قابلة للعب.
- Hub يعرض "📚 اختر المرحلة الدراسية" — الطالب يختار مرحلته (يُحفظ في localStorage).
- **الزوار لا يمكنهم الرفع** — فقط المدير.

## تضمين (Embed) في صفحة existing
```html
<iframe src="/games/match.html" width="100%" height="700" style="border:0;border-radius:12px;"></iframe>
```

## ملاحظات
- كل ملف مستقل (CSS + JS + البيانات داخله) — يعمل بدون اتصال (offline).
- إذا وُجد `game-data.js` في نفس المجلد، تُستخدم بياناته (من المدير) تلقائياً.
- التقدم (نقاط/مستوى/شارات) يُحفظ في `localStorage` في متصفح المستخدم.
- الألعاب بالعربية (RTL) مع كلمات إنجليزية.
- لتعديل المفردات: ابحث عن `const VOCAB` و `const SENTENCES` و `const QUIZ` في كل ملف (أو في `index.html` الأصلي) وأضف/عدّل العناصر.
- لتعديل الألوان: عدّل متغيرات `:root` في `<style>`.

## الألعاب
| ملف | اللعبة | المهارة |
|------|--------|---------|
| match.html | وصل الكلمات | مفردات |
| hit.html | اضرب الكلمة الصحيحة | سرعة/مفردات |
| fill.html | أكمل الجملة | قواعد/سياق |
| memory.html | لعبة الذاكرة | حفظ |
| scramble.html | ترتيب الحروف | إملاء |
| hangman.html | شنق الرجل | تخمين |
| quiz.html | اختبار سريع | مراجعة |
| typing.html | كتابة سريعة | كتابة |
| custom.html | ألعاب مع Excel | مخصص (رفع ملف) |
