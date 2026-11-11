"use client";

import { useEffect, useState } from "react";

/** Время в Бишкеке: день недели (0 — воскресенье) и минуты от полуночи. */
function bishkekNow() {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Bishkek", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const day = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  return { day, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function span(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} ч ${m} мин` : `${m} мин`;
}

/**
 * Таймер торговой сессии по часам «09:00–17:00»: сколько осталось до закрытия или до открытия.
 * Считается в браузере по времени Бишкека и обновляется раз в минуту; до гидратации ничего не показывает,
 * чтобы серверная и клиентская разметка совпали. Праздники не учитывает — это подсказка, а не расписание.
 */
export function Countdown({ hours, className }: { hours: string; className?: string }) {
  const [text, setText] = useState<string | null>(null);

  useEffect(() => {
    const match = hours.match(/(\d{1,2}):(\d{2})\D+(\d{1,2}):(\d{2})/);
    if (!match) return;
    const open = Number(match[1]) * 60 + Number(match[2]);
    const close = Number(match[3]) * 60 + Number(match[4]);
    const update = () => {
      const { day, minutes } = bishkekNow();
      const weekday = day >= 1 && day <= 5;
      if (weekday && minutes >= open && minutes < close) setText(`До закрытия торгов ${span(close - minutes)}`);
      else if (weekday && minutes < open) setText(`До открытия торгов ${span(open - minutes)}`);
      // Сюда попадают выходные и вечер буднего дня: после пятницы торги в понедельник, иначе — завтра.
      else if (day === 5 || day === 6 || day === 0) setText("Следующие торги — в понедельник");
      else setText("Торги завершены, следующие — завтра");
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [hours]);

  if (!text) return null;
  return (
    <p className={className} aria-live="polite">
      {text}
    </p>
  );
}
