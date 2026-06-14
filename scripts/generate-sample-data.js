/**
 * Generates a realistic Google Forms CSV export for Cancer Care Baskets.
 * Column headers intentionally mirror Google Forms' verbose question text,
 * including a couple of messy ones, so the parser's normalization is exercised.
 *
 * Run: npm run gen:sample  ->  writes public/sample-survey.csv
 */
import { writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const HEADERS = [
  'Timestamp',
  'How would you describe where you are in your treatment journey?',
  'Which type of treatment are you currently receiving?',
  'Which hospital / delivery location received your basket?',
  'What is your age range?',
  'How did you hear about Cancer Care Baskets?',
  'Which items in your basket were most helpful? (select all that apply)',
  'For radiation patients: which items would you most want to see? (select all that apply)',
  'Overall, how would you rate your Cancer Care Basket experience?',
  'Anything you would like to share with us?',
]

const journey = ['Newly diagnosed', 'In active treatment', 'In active treatment', 'In active treatment', 'Post-treatment / survivor', 'Caregiver / family']
const treatment = ['Chemotherapy', 'Chemotherapy', 'Chemotherapy', 'Radiation', 'Radiation', 'Both']
const hospitals = [
  'Mount Sinai Miami Beach',
  'Mount Sinai Miami Beach',
  'Mount Sinai Aventura',
  'Mount Sinai Hialeah',
  'Mount Sinai Coral Gables',
]
const ages = ['Under 30', '30–44', '45–59', '45–59', '60–74', '75+']
const heard = ['My care team / nurse', 'Mount Sinai social worker', 'A friend or family member', 'Instagram', 'Our website', '']
const chemoItems = ['Soft blanket', 'Ginger tea', 'Lip balm', 'Cozy socks', 'Hand lotion', 'Journal & pen', 'Hard candy / mints', 'Knit beanie', 'Water bottle', 'Encouragement notes']
const radItems = ['Aloe / skin gel', 'Gentle moisturizer', 'Loose cotton top', 'Soothing balm', 'Reusable water bottle', 'Aquaphor', 'Soft scarf', 'SPF lip balm']
const comments = [
  'The blanket got me through every infusion. Thank you so much.',
  'Felt seen on a really hard day. The notes made me cry (good tears).',
  'Would love more sugar-free snack options if possible.',
  'The ginger tea helped my nausea more than I expected.',
  '', '', '',
  'My nurse handed it to me during my first session — perfect timing.',
  'Could the socks come in larger sizes?',
  'Thank you for thinking of caregivers too.',
  'Skin gel was a lifesaver during radiation.',
  'Everything was thoughtful. You can tell it was made with love.',
  '',
  'More variety in the journal designs would be nice.',
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function pickMany(arr, min, max) {
  const n = min + Math.floor(Math.random() * (max - min + 1))
  const pool = [...arr]
  const out = []
  for (let i = 0; i < n && pool.length; i++) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
  return out.join(', ')
}
function csvCell(v) {
  const s = String(v ?? '')
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

// Spread responses across ~10 months with a realistic upward ramp.
const start = new Date('2025-08-01').getTime()
const end = new Date('2026-06-10').getTime()
const N = 64
const rows = []
for (let i = 0; i < N; i++) {
  // bias timestamps toward the recent end so "responses over time" trends up
  const t = start + (end - start) * Math.pow(Math.random(), 0.7)
  const d = new Date(t)
  const ts = `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
  const tx = pick(treatment)
  const isRad = tx === 'Radiation' || tx === 'Both'
  const isChemo = tx === 'Chemotherapy' || tx === 'Both'
  rows.push([
    ts,
    pick(journey),
    tx,
    pick(hospitals),
    Math.random() < 0.08 ? '' : pick(ages), // some missing demographics
    pick(heard),
    isChemo ? pickMany(chemoItems, 2, 5) : '',
    isRad ? pickMany(radItems, 2, 4) : '',
    Math.random() < 0.05 ? '' : String(3 + Math.floor(Math.random() * 3)), // 3–5, some missing
    pick(comments),
  ])
}

// sort chronologically like a real export
rows.sort((a, b) => new Date(a[0]) - new Date(b[0]))

const csv = [HEADERS, ...rows].map((r) => r.map(csvCell).join(',')).join('\n')
const outPath = join(__dirname, '..', 'public', 'sample-survey.csv')
writeFileSync(outPath, csv)
console.log(`Wrote ${rows.length} rows -> ${outPath}`)
