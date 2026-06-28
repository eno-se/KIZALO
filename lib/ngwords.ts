const NG_WORDS = [
  // 日本語（差別・卑猥）
  "死ね", "殺す", "殺せ", "ころす", "しね",
  "うんこ", "うんち", "ちんこ", "ちんちん", "まんこ", "おっぱい", "セックス", "えっち",
  "バカ", "馬鹿", "アホ", "あほ", "クズ", "くず", "ゴミ", "ごみ",
  "キチガイ", "きちがい",
  // 英語（profanity）
  "fuck", "shit", "bitch", "asshole", "nigger", "nigga", "faggot", "cunt",
  "dick", "pussy", "cock", "penis", "vagina", "sex", "porn", "nude",
  // スパム系
  "line.me", "t.me", "bit.ly",
];

export function containsNgWord(text: string): boolean {
  const lower = text.toLowerCase();
  return NG_WORDS.some((word) => lower.includes(word.toLowerCase()));
}
