export type Language = 'fa' | 'en';

export function formatLastSeen(
  lastSeenIso?: string,
  privacyLastSeen?: 'everyone' | 'nobody',
  isOnline?: boolean,
  lang: Language = 'fa'
): string {
  if (isOnline) {
    return lang === 'en' ? 'Online' : 'آنلاین';
  }
  if (privacyLastSeen === 'nobody') {
    return lang === 'en' ? 'Last seen recently' : 'آخرین بازدید اخیراً';
  }
  if (!lastSeenIso) {
    return lang === 'en' ? 'Last seen recently' : 'آخرین بازدید اخیراً';
  }

  try {
    const date = new Date(lastSeenIso);
    if (isNaN(date.getTime())) {
      return lang === 'en' ? 'Last seen recently' : 'آخرین بازدید اخیراً';
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return lang === 'en' ? 'Last seen just now' : 'آخرین بازدید چند لحظه پیش';
    }
    if (diffMinutes < 60) {
      return lang === 'en' ? `Last seen ${diffMinutes}m ago` : `آخرین بازدید ${diffMinutes} دقیقه پیش`;
    }

    const hoursStr = date.getHours().toString().padStart(2, '0');
    const minutesStr = date.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hoursStr}:${minutesStr}`;

    const isToday = now.toDateString() === date.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = yesterday.toDateString() === date.toDateString();

    if (isToday) {
      return lang === 'en' ? `Last seen today at ${timeStr}` : `آخرین بازدید امروز ساعت ${timeStr}`;
    }
    if (isYesterday) {
      return lang === 'en' ? `Last seen yesterday at ${timeStr}` : `آخرین بازدید دیروز ساعت ${timeStr}`;
    }

    if (diffDays < 7) {
      const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const dayNamesFa = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'];
      const dayName = lang === 'en' ? dayNamesEn[date.getDay()] : dayNamesFa[date.getDay()];
      return lang === 'en' ? `Last seen ${dayName} at ${timeStr}` : `آخرین بازدید ${dayName} ساعت ${timeStr}`;
    }

    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return lang === 'en'
      ? `Last seen on ${year}/${month}/${day} at ${timeStr}`
      : `آخرین بازدید در تاریخ ${year}/${month}/${day} ساعت ${timeStr}`;
  } catch {
    return lang === 'en' ? 'Last seen recently' : 'آخرین بازدید اخیراً';
  }
}

export const translations = {
  fa: {
    chats: 'گفتگوها',
    all: 'همه',
    direct: 'خصوصی',
    group: 'گروه‌ها',
    channel: 'کانال‌ها',
    newChat: 'گفتگوی جدید',
    search: 'جستجو در پیام‌ها و افراد...',
    settings: 'تنظیمات',
    ownerDashboard: 'داشبورد مدیریت',
    subscription: 'اشتراک ویژه Plus',
    aiStudio: 'استودیو هوش مصنوعی',
    voiceCall: 'تماس صوتی',
    videoCall: 'تماس تصویری',
    typeMessage: 'پیامی بنویسید (با رمزنگاری ۲۵۶ بیتی)...',
    draft: 'پیش‌نویس:',
    online: 'آنلاین',
    offline: 'آفلاین',
    lowRamMode: 'حالت بهینه (Low RAM)',
    lowRamActive: 'حالت کم‌مصرف فعال شد',
    language: 'زبان / Language',
    persian: 'فارسی',
    english: 'English',
    profile: 'پروفایل کاربر',
    bio: 'درباره و بیوگرافی',
    privacy: 'حریم خصوصی',
    security: 'امنیت و قفل',
    saveChanges: 'ذخیره تغییرات',
    close: 'بستن',
    typing: 'در حال نوشتن...',
    copyKey: 'کپی کلید',
    copied: 'کپی شد!',
    clearHistory: 'پاکسازی تاریخچه',
    pinChat: 'سنجاق چت',
    unpinChat: 'برداشتن سنجاق',
    muteChat: 'بی‌صدا کردن',
    unmuteChat: 'با صدا کردن',
    deleteChat: 'حذف گفتگو',
    fastAnswer: 'پاسخ سریع',
    deepReasoning: 'تفکر بالا ⭐',
    visionVideo: 'عکس و ویدیو ⭐'
  },
  en: {
    chats: 'Chats',
    all: 'All',
    direct: 'Direct',
    group: 'Groups',
    channel: 'Channels',
    newChat: 'New Chat',
    search: 'Search messages and people...',
    settings: 'Settings',
    ownerDashboard: 'Admin Dashboard',
    subscription: 'Plus Subscription',
    aiStudio: 'AI Studio',
    voiceCall: 'Voice Call',
    videoCall: 'Video Call',
    typeMessage: 'Type a message (256-bit E2EE)...',
    draft: 'Draft:',
    online: 'Online',
    offline: 'Offline',
    lowRamMode: 'Low RAM Mode',
    lowRamActive: 'Low RAM Mode Active',
    language: 'Language / زبان',
    persian: 'فارسی',
    english: 'English',
    profile: 'User Profile',
    bio: 'About & Bio',
    privacy: 'Privacy',
    security: 'Security & Lock',
    saveChanges: 'Save Changes',
    close: 'Close',
    typing: 'Typing...',
    copyKey: 'Copy Key',
    copied: 'Copied!',
    clearHistory: 'Clear History',
    pinChat: 'Pin Chat',
    unpinChat: 'Unpin Chat',
    muteChat: 'Mute',
    unmuteChat: 'Unmute',
    deleteChat: 'Delete Chat',
    fastAnswer: 'Fast Answer',
    deepReasoning: 'Deep Reasoning ⭐',
    visionVideo: 'Vision & Video ⭐'
  }
};
