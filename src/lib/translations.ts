export type Language = 'en' | 'am';

export const TRANSLATIONS: Record<Language, Record<string, string>> = {
  en: {
    // Brand
    brandName: 'Enat Plus',
    brandSub: 'Maternal Care & Hospital Network',

    // Navigation
    navToday: 'Today',
    navWeekly: 'Weekly',
    navReminders: 'Reminders',
    navHealth: 'Health',
    navClinic: 'Clinic & Privacy',
    navMarket: 'Market',
    navCommunity: 'Community',
    navSpecialNeeds: 'Special Needs',
    signOut: 'Sign Out',

    // Dashboard Greeting & Header
    greeting: 'Hello',
    greetingDefault: 'Hello, Mother',
    week: 'Week',
    day: 'day',
    days: 'days',
    of40Weeks: 'of 40 Weeks',
    completed: 'completed',
    trimester1: 'Trimester 1',
    trimester2: 'Trimester 2',
    trimester3: 'Trimester 3',

    // Fetal Status Card
    fetalStage: 'Current Fetal Stage',
    babySize: 'Baby Size',
    estimatedLength: 'Length',
    estimatedWeight: 'Weight',
    viewFullWeeklyGuide: 'View full 40-week illustrated guide',
    estimatedDueDate: 'Estimated Due Date',
    clinicalConfirmationNotice: 'Clinician confirmed EDD takes precedence over LMP estimate.',

    // Upcoming Appointment
    upcomingAppointment: 'Upcoming Appointment',
    noUpcomingAppt: 'No appointment scheduled',
    scheduleWithClinic: 'Schedule with your clinic to coordinate antenatal visits.',
    viewAppointmentDetails: 'Appointment Details',
    confirmed: 'Confirmed',
    scheduledWith: 'Scheduled at',

    // Health Logs & Vitals
    recentHealthLogs: 'Recent Health Activity',
    viewAll: 'View All',
    bloodPressure: 'Blood Pressure',
    normal: 'Normal',
    fetalMovement: 'Fetal Movement',
    activeKicks: 'kicks logged',
    ironFolicAcid: 'Iron & Folic Acid',
    takenWithMeal: 'Taken with breakfast',
    logged: 'Logged',
    logTodayVitals: 'Log Today’s Vitals',
    logBloodPressureOrKicks: 'Record resting BP, weight, or fetal kicks',

    // Clinic & Privacy Banner
    clinicConnection: 'Clinic & Hospital Chart',
    consentActive: 'Consent Active',
    consentInactive: 'Consent Off (Private)',
    consentActiveDesc: 'Your clinic can view your consented health logs for care coordination.',
    consentInactiveDesc: 'Your records remain 100% private on your phone. Clinicians cannot view your data until you grant consent.',
    managePrivacy: 'Manage Privacy & Sharing',

    // Weekly Development Guide
    weeklyTitle: 'Weekly Development Guide',
    weeklySubtitle: 'Track fetal milestones and maternal nutrition across 40 weeks.',
    tabBabyGrowth: 'Baby Growth',
    tabMomsBody: 'Mom’s Body',
    tabCareFood: 'Care & Food',
    myCurrentWeek: 'My Week',
    ethiopianNutritionTip: 'Ethiopian Nutrition Tip',
    babyMilestones: 'Key Milestones This Week',
    maternalChanges: 'Common Body Changes',
    logSymptomsInRecords: 'Log Symptoms in Health Records',
    discussInCommunity: 'Discuss in Community Hub',
    previousWeek: 'Previous Week',
    nextWeek: 'Next Week',

    // Reminders
    remindersTitle: 'Reminders & Routine',
    noRemindersToday: 'No reminders due today',
    dailyIronSupplement: 'Daily Iron & Folic Acid Supplement',
    prenatalVitamins: 'Prenatal Vitamins',
    drinkWater: 'Drink 8 glasses of water',
    restBreak: 'Afternoon rest break',

    // Health Records Page
    recordsTitle: 'Health Records & Journal',
    recordsSubtitle: 'Private log of blood pressure, symptoms, and doctor visits.',
    recordNewLog: 'Record New Vitals',
    bpLabel: 'Resting Blood Pressure',
    weightLabel: 'Weight',
    fetalKicksLabel: 'Fetal Kick Counter',
    notesLabel: 'Notes or Symptoms',
    saveEntry: 'Save Entry',
    sharingSettings: 'Clinic Sharing Settings',

    // Community & Marketplace
    communityTitle: 'Mothers Community Circle',
    communitySubtitle: 'Safe, moderated peer conversations with Ethiopian mothers.',
    marketplaceTitle: 'Motherpreneur Marketplace',
    marketplaceSubtitle: 'Verified maternal pharmacies & local artisanal baby essentials.',
    specialNeedsTitle: 'Special Needs Maternal Hub',
    specialNeedsSubtitle: 'Inclusive educational guides for mothers and children.',

    // Common UI
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    back: 'Back',
    close: 'Close',
    error: 'Error',
    language: 'Language',
    disclaimerBadge: 'Non-Prescriptive Health Companion • MOH Ethiopia Aligned'
  },

  am: {
    // Brand
    brandName: 'እናት ፕላስ',
    brandSub: 'የእናት ጤና እና የሆስፒታል መረብ',

    // Navigation
    navToday: 'ዛሬ',
    navWeekly: 'ሳምንታዊ',
    navReminders: 'ማስታወሻዎች',
    navHealth: 'የጤና መዝገብ',
    navClinic: 'ክሊኒክ እና ምስጢራዊነት',
    navMarket: 'ገበያ',
    navCommunity: 'ማህበረሰብ',
    navSpecialNeeds: 'ልዩ ፍላጎት',
    signOut: 'ውጣ',

    // Dashboard Greeting & Header
    greeting: 'ጤና ይስጥልኝ',
    greetingDefault: 'ጤና ይስጥልኝ እናት',
    week: 'ሳምንት',
    day: 'ቀን',
    days: 'ቀናት',
    of40Weeks: 'ከ 40 ሳምንታት',
    completed: 'ተጠናቋል',
    trimester1: '1ኛ ሶስት ወር',
    trimester2: '2ኛ ሶስት ወር',
    trimester3: '3ኛ ሶስት ወር',

    // Fetal Status Card
    fetalStage: 'የአሁኑ የፅንሱ የእድገት ደረጃ',
    babySize: 'የፅንሱ መጠን',
    estimatedLength: 'ርዝመት',
    estimatedWeight: 'ክብደት',
    viewFullWeeklyGuide: 'ሙሉውን የ40 ሳምንታት መመሪያ ይመልከቱ',
    estimatedDueDate: 'የሚገመተው የመውለጃ ቀን',
    clinicalConfirmationNotice: 'በህክምና ባለሙያ የተረጋገጠው የመውለጃ ቀን ቅድሚያ ይሰጠዋል::',

    // Upcoming Appointment
    upcomingAppointment: 'ቀጣይ የክሊኒክ ቀጠሮ',
    noUpcomingAppt: 'የተመዘገበ ቀጠሮ የለም',
    scheduleWithClinic: 'የቅድመ ወሊድ ምርመራዎን ለማቀናጀት ከክሊኒክዎ ጋር ቀጠሮ ይያዙ::',
    viewAppointmentDetails: 'የቀጠሮ ዝርዝር',
    confirmed: 'የተረጋገጠ',
    scheduledWith: 'የተያዘበት ሆስፒታል',

    // Health Logs & Vitals
    recentHealthLogs: 'የቅርብ ጊዜ የጤና መረጃዎች',
    viewAll: 'ሁሉንም እይ',
    bloodPressure: 'የደም ግፊት',
    normal: 'መደበኛ',
    fetalMovement: 'የፅንሱ እንቅስቃሴ',
    activeKicks: 'እርግጫዎች ተመዝግበዋል',
    ironFolicAcid: 'የአይረን እና ፎሊክ አሲድ',
    takenWithMeal: 'ከቁርስ ጋር ተወስዷል',
    logged: 'ተመዝግቧል',
    logTodayVitals: 'የዛሬውን የጤና መረጃ መዝግብ',
    logBloodPressureOrKicks: 'የደም ግፊት፣ ክብደት ወይም የፅንስ እንቅስቃሴ ይመዝግቡ',

    // Clinic & Privacy Banner
    clinicConnection: 'የሆስፒታል እና ክሊኒክ ግንኙነት',
    consentActive: 'የመረጃ መጋራት ፈቃድ ክፍት ነው',
    consentInactive: 'የመረጃ መጋራት ዝግ ነው (ምስጢራዊ)',
    consentActiveDesc: 'ለተሻለ ክትትል ክሊኒክዎ የፈቀዱትን የጤና መረጃዎን መመልከት ይችላል::',
    consentInactiveDesc: 'መረጃዎ 100% በስልክዎ ላይ ምስጢራዊ ሆኖ ይቀመጣል:: ፈቃድ ካልሰጡ በስተቀር ሀኪሞች መመልከት አይችሉም::',
    managePrivacy: 'ምስጢራዊነትን እና ፈቃድን ያስተካክሉ',

    // Weekly Development Guide
    weeklyTitle: 'ሳምንታዊ የፅንስ እድገት መመሪያ',
    weeklySubtitle: 'የ40 ሳምንታትን የፅንስ እድገት እና የእናት ተስማሚ አመጋገብ ይከታተሉ::',
    tabBabyGrowth: 'የፅንስ እድገት',
    tabMomsBody: 'የእናት አካል',
    tabCareFood: 'እንክብካቤ እና ምግብ',
    myCurrentWeek: 'የእኔ ሳምንት',
    ethiopianNutritionTip: 'የኢትዮጵያ ተስማሚ የአመጋገብ ምክር',
    babyMilestones: 'በዚህ ሳምንት የሚታዩ ዋና ዋና እድገቶች',
    maternalChanges: 'በእናት ሰውነት ላይ የሚታዩ ለውጦች',
    logSymptomsInRecords: 'ምልክቶችን በጤና መዝገብ ላይ መዝግብ',
    discussInCommunity: 'በማህበረሰብ ውይይት መድረክ ጠይቁ',
    previousWeek: 'ቀዳሚ ሳምንት',
    nextWeek: 'ቀጣይ ሳምንት',

    // Reminders
    remindersTitle: 'ማስታወሻዎች እና የዕለት ተዕለት ተግባራት',
    noRemindersToday: 'ለዛሬ የተያዘ ማስታወሻ የለም',
    dailyIronSupplement: 'የዕለት የአይረን እና ፎሊክ አሲድ ቅበላ',
    prenatalVitamins: 'የቅድመ-ወሊድ ቫይታሚኖች',
    drinkWater: '8 ብርጭቆ ውሃ ይጠጡ',
    restBreak: 'የቀትር እረፍት ያድርጉ',

    // Health Records Page
    recordsTitle: 'የጤና መዝገብ እና ማስታወሻ',
    recordsSubtitle: 'የደም ግፊት፣ ምልክቶች እና የሀኪም ጉብኝት የግል መዝገብ::',
    recordNewLog: 'አዲስ የጤና መረጃ መዝግብ',
    bpLabel: 'የእረፍት ጊዜ የደም ግፊት',
    weightLabel: 'ክብደት',
    fetalKicksLabel: 'የፅንስ እርግጫ መቁጠሪያ',
    notesLabel: 'ተጨማሪ ማስታወሻ ወይም ምልክት',
    saveEntry: 'መዝግበህ አስቀምጥ',
    sharingSettings: 'የክሊኒክ መረጃ መጋራት ቅንብር',

    // Community & Marketplace
    communityTitle: 'የእናቶች ማህበረሰብ ክበብ',
    communitySubtitle: 'ከሌሎች ኢትዮጵያውያን እናቶች ጋር የሚደረግ አስተማማኝ እና ሚስጥራዊ የልምድ ልውውጥ::',
    marketplaceTitle: 'የሴቶች የፈጠራ ገበያ (Motherpreneur)',
    marketplaceSubtitle: 'የተረጋገጡ የፋርማሲ ምርቶች እና በእጅ የተሰሩ የህፃናት አልባሳት::',
    specialNeedsTitle: 'የልዩ ፍላጎት የእናቶች ማዕከል',
    specialNeedsSubtitle: 'ልዩ እንክብካቤ ለሚያስፈልጋቸው እናቶች እና ህፃናት የተዘጋጀ መመሪያ::',

    // Common UI
    loading: 'በመጫን ላይ...',
    save: 'አስቀምጥ',
    cancel: 'ሰርዝ',
    back: 'ተመለስ',
    close: 'ዝጋ',
    error: 'ስህተት ተከስቷል',
    language: 'ቋንቋ',
    disclaimerBadge: 'የጤና መመሪያ ረዳት • ከኢትዮጵያ ጤና ጥበቃ ሚኒስቴር መመሪያ ጋር የተጣጣመ'
  }
};
