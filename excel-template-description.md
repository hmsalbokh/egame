# وصف قالب Excel — English Fun (لـ Google NotebookLM)

## نظرة عامة
ملف `excel-template.xlsx` هو قالب Excel (4 أوراق) يُستخدم من لوحة الإدارة (`admin.html`) để تخصيص مفردات الألعاب والاختبارات ولوحة أبطال الأسبوع. كل ورقة (sheet) لها بنية (schema) محددة. الأعمدة separated by commas في بعض الحقول (Options).

تُقرأ أوراق Excel via SheetJS (مكتبة JavaScript) في `admin.html`، ثم تُولّد ملف `game-data.js` (JSON) يُرفع على الخادم. جميع الألعاب (8 ألعاب) تقرأ `game-data.js` تلقائياً (إن وُجد) لاستخدام بياناتك.

---

## الورقة 1: Vocabulary (المفردات)

### الغرض
توفير قاموس كلمات (إنجليزي ↔ عربي) مع emoji، يُستخدم في الألعاب: وصل الكلمات، اضرب الكلمة، ترتيب الحروف، شنق الرجل، كتابة سريعة، لعبة الذاكرة.

### الأعمدة (3 أعمدة)
| العمود | الاسم (Header) | النوع | الوصف | مثال |
|--------|----------------|-------|-------|------|
| A | English | نص (String) | الكلمة الإنجليزية (مفتاح المطابقة) | apple |
| B | Arabic | نص (String) | ترجمة/معنى الكلمة بالعربية | تفاحة |
| C | Emoji | نص/Emoji | رمز تعبيري (اختياري، يُعرض بجانب الكلمة) | 🍎 |

### قواعد
- الصف 1 = رؤوس الأعمدة (headers). البيانات من الصف 2 فصاعداً.
- العمود A (English) إلزامي؛ nếu فارغ، يُتجاهل الصف.
- العمود B (Arabic) اختياري لكن موصى به.
- العمود C (Emoji) اختياري (يمكن تركه فارغاً).
- `English` يُستخدم كمفتاح مطابقة (key) في لعبة "وصل الكلمات" و"لعبة الذاكرة" (يجب أن تكون الكلمات فريدة).
- لا تكرر نفس الكلمة الإنجليزية.

### مثال بيانات
```
English | Arabic  | Emoji
apple   | تفاحة  | 🍎
book    | كتاب   | 📘
cat     | قطة   | 🐱
dog     | كلب   | 🐶
house   | منزل  | 🏠
```

### الاستخدام في الألعاب
- **وصل الكلمات (match)**: 6 كلمات عشوائية من VOCAB، left=English+emoji، right=Arabic.
- **اضرب الكلمة (hit)**: معنى عربي → choose English among 4 (1 صحيح + 3 distractors).
- **ترتيب الحروف (scramble)**: Meaning Arabic → unscramble English letters.
- **شنق الرجل (hangman)**: Meaning Arabic → guess English word letter by letter.
- **كتابة سريعة (typing)**: Arabic → type English.
- **لعبة الذاكرة (memory)**: 6 أزواج (English ↔ Arabic) flip cards.

---

## الورقة 2: Sentences (الجمل)

### الغرض
توفير جمل فيها فراغ (___) مع الإجابة والخيارات، يُستخدم في "أكمل الجملة (fill)".

### الأعمدة (3 أعمدة)
| العمود | الاسم (Header) | النوع | الوصف | مثال |
|--------|----------------|-------|-------|------|
| A | Sentence | نص (String) | جملة إنجليزية تحتوي على `___` (3 شرطات سفلية) كفراغ | I ___ an apple every day. |
| B | Answer | نص (String) | الكلمة الصحيحة (exact match) | eat |
| C | Options | نص (String) | خيارات مفصولة بفواصل (comma-separated)، 4 خيارات | eat,drink,run,read |

### قواعد
- `Sentence` يجب أن يحتوي على `___` (ثلاثة underscores) بالضبط (يُستبدل بـ blank span).
- `Answer` يجب أن يكون أحد `Options` (مطابقة exact string).
- `Options`: 4 خيارات مفصولة بـ comma (`,`). يمكن 2-5 options.
- الجملة باللغة الإنجليزية (LTR). Arabic غير مطلوب (المعنى في السياق).
- لا تستخدم comma внутри options (لأن comma هو separator).

### مثال بيانات
```
Sentence | Answer | Options
I ___ an apple every day. | eat | eat,drink,run,read
The cat is ___ on the table. | sitting | sitting,running,flying,swimming
She ___ to school by bus. | goes | goes,go,going,went
My mother is a ___. | teacher | teacher,student,doctor,driver
The sky is ___. | blue | blue,red,green,yellow
```

### الاستخدام في الألعاب
- **أكمل الجملة (fill)**: عرض الجملة، اختيار الكلمة من Options. +12 نقطة при صحيح.

---

## الورقة 3: Quiz (الاختبار)

### الغرض
أسئلة متعددة الخيارات (MCQ) حول المفردات والقواعد، يُستخدم في "اختبار سريع (quiz)".

### الأعمدة (3 أعمدة)
| العمود | الاسم (Header) | النوع | الوصف | مثال |
|--------|----------------|-------|-------|------|
| A | Question | نص (String) | سؤال (يمكن أن يكون عربياً أو إنجليزياً) | ما معنى كلمة "book"? |
| B | Answer | نص (String) | الإجابة الصحيحة (exact match) | كتاب |
| C | Options | نص (String) | خيارات مفصولة بفواصل | كتاب,قلم,كرسي,باب |

### قواعد
- `Question` إلزامي.
- `Answer` يجب أن يكون أحد `Options`.
- `Options`: 4 خيارات مفصولة بـ comma.
- يمكن أن تكون الأسئلة بالعربية (RTL) أو الإنجليزية (LTR) — UI يعرضها centered.

### مثال بيانات
```
Question | Answer | Options
ما معنى كلمة "book"? | كتاب | كتاب,قلم,كرسي,باب
ما معنى كلمة "run"? | يركض | يركض,يجلس,ينام,يأكل
أي كلمة تعني "شمس"? | sun | sun,moon,star,cloud
أي كلمة تعني "ماء"? | water | water,fire,earth,air
ما جمع "child"? | children | childs,children,childes,child
أي جملة صحيحة؟ | She goes to school. | She go to school.,She goes to school.,She going to school.,She wents to school.
```

### الاستخدام في الألعاب
- **اختبار سريع (quiz)**: MCQ، +15 نقطة при صحيح، combo multiplier.

---

## الورقة 4: Leaderboard (لوحة أبطال الأسبوع) — اختيارية

### الغرض
عرض لوحة متصدرين (أبطال الأسبوع) على Hub (`index.html`) كـ widget. يُدار من المدير (admin) (لأن localStorage per-device).

### الأعمدة (3 أعمدة)
| العمود | الاسم (Header) | النوع | الوصف | مثال |
|--------|----------------|-------|-------|------|
| A | Name | نص (String) | اسم اللاعب | أحمد |
| B | Points | عدد (Integer) | نقاط اللاعب | 1200 |
| C | Title | نص (String) | لقب اللاعب (اختياري) | صائد الكلمات |

### قواعد
- `Name` إلزامي؛ إذا فارغ، يُتجاهل الصف.
- `Points` عدد (integer). إذا فارغ/غير رقم، يُعتبر 0.
- `Title` اختياري (يُعرض كـ text بجانب الاسم — حالياً فقط Name + Points يُعرضان في widget).
- يُعرض top 10 (slice(0,10)).
- الترتيب: كما في Excel (لا auto-sort). للمدير فرز يدوياً.

### مثال بيانات
```
Name | Points | Title
أحمد | 1200 | صائد الكلمات
سارة | 980  | أسطورة السرعة
محمد | 750  | بطل الاختبار
```

### الاستخدام في UI
- **Hub (index.html)**: widget "🏆 لوحة أبطال الأسبوع" يُعرض إذا `GAME_DATA.leaderboard` non-empty.

---

## هيكل JSON الناتج (`game-data.js`)

```js
window.GAME_DATA = {
  "vocab": [
    {"en":"apple","ar":"تفاحة","emoji":"🍎"},
    ...
  ],
  "sentences": [
    {"s":"I ___ an apple every day.","a":"eat","opts":["eat","drink","run","read"]},
    ...
  ],
  "quiz": [
    {"q":"ما معنى كلمة \"book\"?","a":"كتاب","opts":["كتاب","قلم","كرسي","باب"]},
    ...
  ],
  "leaderboard": [
    {"Name":"أحمد","Points":1200,"Title":"صائد الكلمات"},
    ...
  ]
};
```

---

## قواعد عامة (Best Practices)

1. **الترميز**: UTF-8 (Excel يدعم Arabic تلقائياً).
2. **رؤوس الأعمدة**: استخدم الأسماء exact (English, Arabic, Emoji, Sentence, Answer, Options, Question, Name, Points, Title) — case-sensitive? الـ parser uses `wb.Sheets['Vocabulary']` (exact sheet name) and `XLSX.utils.sheet_to_json(sheet,{header:1})` (reads first row as headers but ignores header values — uses column index). لذا رؤوس الأعمدة informational (position-based). Position matters, not header text.
3. **فواصل Options**: comma (`,`) بدون spaces (أو مع spaces — يُ trim تلقائياً).
4. **عدم استخدام comma داخل option**: لأن comma = separator.
5. **عدم تكرار كلمات في Vocabulary**: English key must be unique (used in matching games).
6. **Answer ∈ Options**: في Sentences/Quiz، Answer يجب أن يكون one of Options (exact string).
7. **`___` في Sentence**: 3 underscores بالضبط.
8. **Emoji**: optional (يمكن ترك C column فارغاً).
9. **Leaderboard**: optional sheet (إذا absent، widget لا يُعرض).
10. **عدد الصفوف**: لا حد (لكن 10-50 recommended for performance). الألعاب تأخذ slice(0,n) subsets.

---

## تدفق العمل (Workflow)

1. المدير يفتح `admin.html` (كلمة مرور).
2. يرفع `.xlsx` (أو يعدل `excel-template.xlsx`).
3. `parseWorkbook()` reads 4 sheets → builds `{vocab, sentences, quiz, leaderboard}`.
4. Preview counts displayed.
5. المدير clicks "توليد game-data.js" → download JSON file.
6. المدير uploads `game-data.js` to server (same folder as games).
7. جميع الألعاب (8 + Hub) تقرأ `game-data.js` تلقائياً (إن وُجد) via `<script src="game-data.js">` + `window.GAME_DATA` override.
8. إذا absent → fallback to built-in defaults.

---

## ملاحظات لـ NotebookLM

- هذا الوصف يشرح **schema** و **semantics** of Excel template.
- لا يحتوي على code (HTML/JS) — فقط data contract.
- يُستخدم لـ: generating new Excel templates, validating data, extending with new sheets (e.g., "Grammar", "Listening").
- القيود: no backend; data is static JSON; per-device localStorage for scores (not Excel).

---

## اقتراحات تحسين (Future)

- إضافة ورقة "Grammar" (قواعد) — sentences with grammar tags.
- إضافة ورقة "Listening" (استماع) — audio URLs + transcripts.
- Auto-sort Leaderboard by Points.
- CSV export (alternative to XLSX) for simpler editing.
- Validation: reject rows where Answer ∉ Options.
