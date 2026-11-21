// Enat Plus Amharic & English Localization Dictionary

export type SupportedLanguage = 'en' | 'am';

export const translations = {
  en: {
    appName: 'Enat Plus',
    tagline: 'Every Week Matters. Every Mother Matters.',
    today: 'Today',
    weekly: 'Weekly Guide',
    reminders: 'Reminders',
    healthRecords: 'Health Records',
    clinicAndPrivacy: 'Clinic & Privacy',
    week: 'Week',
    day: 'day',
    days: 'days',
    trimester: 'Trimester',
    edd: 'Estimated Due Date',
    clinicianConfirmed: 'Clinician Confirmed',
    progressThrough40: 'Progress through 40 Weeks',
    nextAppointment: 'Next Appointment',
    todaysReminders: 'Today\'s Reminders',
    bloodPressure: 'Blood Pressure',
    weight: 'Weight',
    symptom: 'Symptom',
    note: 'Note',
    save: 'Save',
    cancel: 'Cancel',
    scheduled: 'Scheduled',
    attended: 'Attended',
    missed: 'Missed',
  },
  am: {
    appName: 'እናት ፕላስ',
    tagline: 'እያንዳንዱ ሳምንት ወሳኝ ነው። እያንዳንዷ እናት ትከበራለች።',
    today: 'ዛሬ',
    weekly: 'ሳምንታዊ መመሪያ',
    reminders: 'ማስታወሻዎች',
    healthRecords: 'የጤና መዝገብ',
    clinicAndPrivacy: 'ክሊኒክ እና ሚስጥራዊነት',
    week: 'ሳምንት',
    day: 'ቀን',
    days: 'ቀናት',
    trimester: 'የትውልድ ወቅት',
    edd: 'የሚወልዱበት ቀን (ግምት)',
    clinicianConfirmed: 'በሀኪም የተረጋገጠ',
    progressThrough40: 'የ 40 ሳምንታት ሂደት',
    nextAppointment: 'ቀጣይ ቀጠሮ',
    todaysReminders: 'የዛሬ ማስታወሻዎች',
    bloodPressure: 'የደም ግፊት',
    weight: 'ክብደት',
    symptom: 'ስሜቶች / ምልክቶች',
    note: 'ማስታወሻ',
    save: 'አስቀምጥ',
    cancel: 'ሰርዝ',
    scheduled: 'የተያዘ',
    attended: 'የተከናወነ',
    missed: 'ያመለጠ',
  },
};

export function getTranslation(lang: SupportedLanguage = 'en') {
  return translations[lang] || translations.en;
}
