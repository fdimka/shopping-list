export class ApiError extends Error {
  constructor(public readonly status: number) {
    super(`HTTP ${status}`);
  }
}
export function errorMessage(error: unknown): string {
  if (!(error instanceof ApiError))
    return "לא ניתן להתחבר לשרת. בדקו את החיבור ונסו שוב.";
  const messages: Record<number, string> = {
    400: "הפרטים שנשלחו אינם תקינים. בדקו את השדות ונסו שוב.",
    401: "אין הרשאה לביצוע הפעולה.",
    403: "הגישה לפעולה זו חסומה.",
    404: "המידע המבוקש לא נמצא בשרת.",
    409: "הזמנה זו כבר נשמרה עם פרטים אחרים. בדקו את ההזמנה לפני ניסיון נוסף.",
    413: "הבקשה גדולה מדי.",
    429: "נשלחו יותר מדי בקשות. המתינו מעט ונסו שוב.",
    500: "אירעה שגיאה בשרת. נסו שוב מאוחר יותר.",
    502: "שירות נדרש אינו זמין כרגע. נסו שוב מאוחר יותר.",
    503: "השירות אינו זמין כרגע. נסו שוב מאוחר יותר.",
    504: "השרת לא השיב בזמן. ניתן לנסות שוב.",
  };
  return messages[error.status] || "הבקשה לא הושלמה. נסו שוב מאוחר יותר.";
}
export async function requestJson<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    if (!response.ok) throw new ApiError(response.status);
    return (await response.json()) as T;
  } finally {
    clearTimeout(timeout);
  }
}
