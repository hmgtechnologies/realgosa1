// ====================================================================
// School Connect — Site Config (auto-generated)
// Replace the URL and anon key below with your Supabase project values.
// ====================================================================
window.SUPABASE_URL = 'https://dgarrlzbmscpgtefdupm.supabase.co';
window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnYXJybHpibXNjcGd0ZWZkdXBtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzMzc0MTYsImV4cCI6MjA5NzkxMzQxNn0.7CNB3KcQD3NHr6ENDGb7gRX_ld_xjgpQeL_YVuLRW_A';
window.SCHOOL = {
  name:    'God of Seed Academy',
  short:   'GOSA',
  motto:   'Excellence in Learning and Character',
  currency:'₦',
  phone:   '2348088667076',
  email:   'godofseedacademy@gmail.com',
  address: '63B, Ishaga Abosule Street, Agbado Crossing, Ogun State',
  campuses:[],
  theme:   'theme2',
  font:    'montserrat',
  fontFamily: 'Montserrat',
  fontCss: 'Montserrat:wght@300;400;500;600;700',
  layout:  'layout0',
  modules: ["students","staff","academic_setup","classes","subjects","attendance","results","timetable","sow","cbt","cbt-prompts","report-cards","timetable-generator","checkin","assignments","library","digital_library","conduct","health","promotion","lms","gamification","career_counseling","lesson_plans","behaviour","support_plans","substitutions","entrance","storage","analytics","approvals","admin-data","settings","admissions","hr","payroll","staff_loans","staff_bonus","appraisals","hostel","alumni","inventory","certificates","document_builder","fleet_tracking","compliance","activity_log","facility_booking","academic_records","developer","diary","announcements","surveys","events","messages","inbox","complaints","broadcast","voting","parent_meeting","front_desk","helpdesk","menu","gallery","eresources","birthdays","idcards","flyer","reports","directory","departments","parents","school_calendar","lost_found","book_request","fees","finance","leave","visitors","transport","cafeteria","financial_aid","donations","payments_online","rubrics","transcripts","transfer_cert","counselling"],
  levels:  ["JSS 1","JSS 2","JSS 3","SSS 1","SSS 2","SSS 3"],
  hmgLink: 'https://hmgconcepts.pages.dev/',
  logoExt: 'png',
  primary: '#1c72e7',
  accent:  '#5e2174'
};

// Build the supabase client
const sb = (window.supabase && SUPABASE_URL !== 'YOUR_SUPABASE_URL')
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

console.log('%c[God of Seed Academy] School Connect ready.', 'color:#1c72e7;font-weight:bold;font-size:13px');
