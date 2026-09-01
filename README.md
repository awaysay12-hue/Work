# 🌟 ប្រព័ន្ធគ្រប់គ្រងការងារ និងកិច្ចការប្រចាំថ្ងៃ (Khmer Work & Task Management System)

ប្រព័ន្ធគ្រប់គ្រងកិច្ចការងារប្រចាំថ្ងៃ បង្កើតឡើងយ៉ាងសម្រិតសម្រាំងសម្រាប់ក្រុមការងារ ស្ថាប័ន និងក្រុមហ៊ុន ដោយគាំទ្រភាសាខ្មែរពេញលេញ ផ្ទាំងស្ថិតិ Task Analytics, Focus Mode (Pomodoro), Real-time Calendar, សំឡេងកម្សាន្ត (Sound FX), ប្រព័ន្ធសិទ្ធិប្រើប្រាស់ច្រើនកម្រិត (RBAC) និងការភ្ជាប់ Cloud Database ជាមួយ Supabase។

---

## 🚀 របៀប Hosting ឱ្យដំណើរការ (Deployment Options)

### ជម្រើសទី ១៖ Deploy តាមរយៈ Vercel (ណែនាំបំផុត - ឥតគិតថ្លៃ និងលឿន)
1. ចូលទៅកាន់ [vercel.com](https://vercel.com) ហើយចុះឈ្មោះចូលដោយប្រើគណនី GitHub
2. ចុច **"Add New..."** ➔ **"Project"**
3. ជ្រើសរើស repository `Work-Management-`
4. ចុច **"Deploy"** ជាការស្រេច! Vercel នឹងផ្តល់ជូន Link វេបសាយ (Live URL) ភ្លាមៗ។

---

### ជម្រើសទី ២៖ Deploy លើ GitHub Pages ដោយស្វ័យប្រវត្តិ
គម្រោងនេះមានផ្ទុកស្រាប់នូវ GitHub Actions Workflow (`.github/workflows/deploy.yml`)៖
1. នៅលើ GitHub Repository របស់អ្នក ចូលទៅកាន់ផ្ទាំង **Settings** ➔ **Pages**
2. នៅត្រង់ចំណុច **Source** សូមជ្រើសរើសយក **GitHub Actions**
3. រាល់ពេលធ្វើការ `git push` ឡើងទៅ GitHub នោះ GitHub Pages នឹង Build និងបញ្ចេញ Live Website ឱ្យដោយស្វ័យប្រវត្តិ។

---

### ជម្រើសទី ៣៖ Deploy តាមរយៈ Netlify
1. ចូលទៅកាន់ [netlify.com](https://netlify.com)
2. ចុច **"Import an existing project"** ➔ ជ្រើសរើស **GitHub**
3. ជ្រើសរើស repository `Work-Management-`
4. Build command: `npm run build`
5. Publish directory: `dist`
6. ចុច **"Deploy site"**

---

## 💻 របៀបរត់នៅលើកុំព្យូទ័រ (Local Development)

```bash
# ១. Clone repository មកកាន់កុំព្យូទ័រ
git clone https://github.com/awaysay12-hue/Work-Management-.git

# ២. ចូលទៅកាន់ folder គម្រោង
cd Work-Management-

# ៣. ដំឡើង Dependencies
npm install

# ៤. បើកដំណើរការ Development Server
npm run dev
```

---

## 🔑 គណនីសម្រាប់ Login សាកល្បង (Default Accounts)

| តួនាទី (Role) | អ៊ីមែល / Username | ពាក្យសម្ងាត់ (Password) |
|---|---|---|
| **Super Admin** | `sunpunleu168@gmail.com` | `123` |
| **Admin** | `admin@company.com` | `123` ឬ `123456` |
| **Manager** | `manager@company.com` | `123456` ឬ `manager123` |
| **Member** | `member@company.com` | `123456` ឬ `member123` |
| **Viewer** | `viewer@company.com` | `123456` ឬ `viewer123` |

---

## 🛠️ បច្ចេកវិទ្យាប្រើប្រាស់ (Tech Stack)
- **Framework**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS, Lucide React Icons
- **Animation**: Canvas Confetti, Framer Motion transitions
- **Audio & FX**: Web Audio API Sound Synthesizer
- **Database**: Supabase PostgreSQL / Cloud REST API + LocalStorage Fallback
