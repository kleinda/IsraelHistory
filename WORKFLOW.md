# תיעוד מהלכי עבודה – אתר היסטוריה של ישראל

מאגר: https://github.com/kleinda/IsraelHistory
אתר חי: https://israelhistory.vercel.app

---

## 1. התקנה ראשונה במחשב חדש (פעם אחת לכל מחשב)

### 1.1 תוכנות נדרשות
- **Node.js** (גרסת LTS): https://nodejs.org
- **Git**: https://git-scm.com

בדיקה שההתקנה הצליחה:
```
node --version
git --version
```

### 1.2 הגדרת זהות ב-Git (GLOBAL, לכל הפרויקטים במחשב)
```
git config --global user.name "David Kleinman"
git config --global user.email "212429119+kleinda@users.noreply.github.com"
```
> **חשוב:** משתמשים בכתובת ה-noreply של GitHub ולא במייל הפרטי.
> עם המייל הפרטי GitHub ידחה את ה-push (שגיאה GH007, ראו סעיף 6).

בדיקה:
```
git config --global user.name
git config --global user.email
```

### 1.3 הורדת הפרויקט
```
cd C:\CHAT_GPT_PROJECTS
git clone https://github.com/kleinda/IsraelHistory.git
cd IsraelHistory
npm install
```
בהרצה הראשונה של `git push` ייפתח חלון התחברות ל-GitHub. מתחברים פעם אחת, ו-Windows שומר את ההרשאה.

---

## 2. עבודה שוטפת (בכל פעם שמתחילים לעבוד)

```
cd C:\CHAT_GPT_PROJECTS\IsraelHistory
git pull                 # 1. מושכים את השינויים מהמחשב השני
npm run dev              # 2. מפעילים את האתר: http://localhost:5173
```
עוצרים את השרת עם `Ctrl+C`.

### בסיום העבודה: שמירה ושליחה ל-GitHub
```
npm run validate         # 3. בודקים שהנתונים תקינים
git add .                # 4. מוסיפים את כל השינויים
git commit -m "תיאור קצר של מה שעשיתי"
git push                 # 5. שולחים ל-GitHub
```

### קיצור דרך: `publish.bat`
דאבל-קליק על `publish.bat` בתיקיית הפרויקט, או מהטרמינל:
```
publish.bat תיאור השינוי
```
הקובץ מבצע לפי הסדר: validate, ואז commit, ואז `git pull`, ואז `git push`. אחר כך Vercel מעדכן את האתר החי.
אם שלב כלשהו נכשל, הקובץ עוצר ושום דבר לא מתפרסם.

> **כלל זהב:** תמיד `git pull` בתחילת העבודה ו-`git push` בסופה.
> כך שני המחשבים נשארים מסונכרנים ואין התנגשויות.

---

## 3. פקודות הפרויקט

| פקודה | מה היא עושה |
|---|---|
| `npm install` | מתקינה ספריות (אחרי clone, או כשה-package.json משתנה) |
| `npm run dev` | מפעילה את האתר במחשב לפיתוח |
| `npm run validate` | בודקת את כל קובצי הנתונים: מזהים, קישורים, תאריכים, איזון קטגוריות |
| `npm run build` | בונה גרסה סופית לתיקיית `dist` (כולל validate) |
| `npm run preview` | מציגה את הגרסה הבנויה |
| `npm run images` | מעדכנת את כתובות התמונות מוויקיפדיה (אחרי הוספת אירועים עם `wiki`) |

---

## 4. איפה נמצא המידע

| קובץ | תוכן |
|---|---|
| `src/data/events/*.json` | האירועים, מחולקים לפי תקופות |
| `src/data/wars.json` | המלחמות |
| `src/data/governments.json` | הממשלות |
| `src/data/people.json` | האישים |
| `src/data/presidents.json` | נשיאי המדינה וממלאי מקום (לדף "מנהיגים"); לנשיא האחרון `"end": null` |
| `src/data/chiefs.json` | הרמטכ״לים (לדף "מנהיגים"); לרמטכ״ל המכהן `"end": null` |
| `src/data/images.json` | **כתובות** התמונות (נוצר על ידי `npm run images`) |

> התמונות **לא נשמרות במחשב**. הן נטענות ישירות מ-Wikimedia Commons, ולכן אין צורך להעביר אותן.

### הוספת אירוע: מבנה
```json
{
  "id": "my-event",
  "date": "1967-06-05",
  "title": "כותרת",
  "summary": "משפט או שניים של תקציר.",
  "body": ["פסקה ראשונה...", "פסקה שנייה..."],
  "category": "military",
  "also": ["politics"],
  "importance": 2,
  "people": ["dayan"],
  "related": ["six-day-war-start"],
  "wiki": "English Wikipedia title"
}
```
- `category`: אחת מאלה: politics, military, terror, affair, peace, aliyah, economy, society, culture, science, disaster, shoah
- `also`: קטגוריות משניות (לא חובה)
- `importance`: 1 עד 3. ב-3 מוצגת תמונה בכרטיס.
- אחרי הוספה מריצים `npm run images` ואז `npm run validate`.

---

## 5. פרסום ב-Vercel

### המצב הנוכחי (מחובר ✓)
| פרט | ערך |
|---|---|
| כתובת ראשית | https://israelhistory.vercel.app |
| כתובת נוספת (אוטומטית) | https://israel-history-beta.vercel.app |
| צוות ב-Vercel | David's projects (`davidklein1`) |
| שם הפרויקט | `israel-history` |
| מחובר למאגר | `kleinda/IsraelHistory`, ענף `main` |

**עדכון האתר החי:** רק `git push`. Vercel בונה ומפרסם תוך כדקה.
מעקב אחרי בנייה: https://vercel.com/davidklein1/israel-history

### שינוי או הוספה של כתובת
ב-Vercel נכנסים לפרויקט, ואז ל-**Settings → Domains**. מקלידים כתובת, למשל `xxx.vercel.app`, ולוחצים **Add**.

### הקמה מאפס (אם פעם יהיה צורך)
**האפשרות המומלצת היא חיבור קבוע ל-GitHub:**
1. נכנסים ל-https://vercel.com ומתחברים עם GitHub.
2. בוחרים **Add New → Project**, ואז את המאגר `IsraelHistory`, ולוחצים **Deploy**.
3. מאותו רגע כל `git push` מעדכן את האתר החי אוטומטית.

**אפשרות חלופית: מהמחשב**
```
npx vercel          # בפעם הראשונה: התחברות והגדרת פרויקט
npx vercel --prod   # פרסום לאתר החי
```

---

## 6. תקלות שכבר קרו ופתרונן

### `remote: error: GH007: Your push would publish a private email address`
ה-commit נשא את המייל הפרטי. הפתרון:
```
git config --global user.email "212429119+kleinda@users.noreply.github.com"
git commit --amend --reset-author --no-edit
git push
```
(ה-`--amend` מתקן רק את ה-commit האחרון. אם כמה commits נשאו את המייל הפרטי, צריך לתקן כל אחד מהם.)

### `error: remote origin already exists`
כבר מוגדרת כתובת מאגר. כדי לתקן אותה:
```
git remote -v                                                  # מה מוגדר עכשיו
git remote set-url origin https://github.com/kleinda/IsraelHistory.git
```

### `remote: Repository not found`
- בודקים שהכתובת נכונה (`git remote -v`). השם הוא בדיוק `IsraelHistory`.
- בודקים שהמאגר קיים ב-GitHub ושאתה מחובר לחשבון `kleinda`.

### `rejected ... (fetch first)` בזמן push
במחשב השני נשלחו שינויים שעוד לא נמשכו. הפתרון:
```
git pull
git push
```

### האתר לא עולה אחרי clone או pull
```
npm install
npm run dev
```
