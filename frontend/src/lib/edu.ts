/** Учебный центр встроен в сайт; NEXT_PUBLIC_EDU_URL — если нужно увести ссылку на другой адрес. */
export const EDU_PLATFORM_URL = process.env.NEXT_PUBLIC_EDU_URL ?? "/education/app";

/** Встроенный учебный центр открываем в той же вкладке; новую — только для внешнего адреса из настроек. */
export function eduLinkProps(url: string) {
  return /^https?:\/\//i.test(url) ? { target: "_blank", rel: "noopener noreferrer" } : {};
}
