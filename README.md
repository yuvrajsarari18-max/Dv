# Luna — Cycle Companion

A responsive, privacy-first menstrual cycle and mood journal built with React + Vite. It is deployable as a static site on Vercel.

## Run locally

```bash
npm install
npm run dev
```

## Build and test

```bash
npm test
npm run build
npm run preview
```

## Deploy to Vercel

1. Create a GitHub repository and upload/push this folder.
2. In Vercel, choose **Add New → Project** and import the repository.
3. Framework preset: **Vite**. Build command: `npm run build`. Output directory: `dist`.
4. Deploy. No environment variables or backend are needed.

You can also deploy using the Vercel CLI from this directory:

```bash
npx vercel
```

## Included features

- Calendar with estimated phase colors, cycle days, predicted period dates, and date selection.
- Quick logging of real period starts, including irregular/early/late starts and corrections to the latest logged date.
- Cycle length and period length settings.
- Mood, flow, pain scale, symptom, and note journal by date.
- Cycle history and lightweight insights.
- Responsive desktop/mobile layout, motion effects, and automatic local saving.
- Data stays in this browser's `localStorage`; there is no account, server, or data sync.

## Phase ranges from the supplied video

The reference video labels: Menstrual days 1–6, Follicular days 6–13, Ovulation day 14, Luteal days 15–25, and PMS days 25–28. It overlaps at days 6 and 25. To keep calendar dates from counting twice, Luna assigns day 6 to Menstrual and day 25 to PMS; therefore the calendar display uses Menstrual 1–6, Follicular 7–13, Ovulation 14, Luteal 15–24, and PMS 25–28. The guide still calls out the overlapping labels from the video.

**Health note:** Phase dates and mood patterns are estimates, not diagnoses or promises about how someone will feel. Actual dates and logged symptoms should take priority. Calendar estimates cannot confirm ovulation or prevent pregnancy.
