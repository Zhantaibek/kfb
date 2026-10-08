import { EDU_URL } from "@/lib/edu";

/**
 * Учебный центр — отдельный проект. Старые адреса раздела (/education, /education/plan, /education/app/…)
 * из закладок и поисковиков ведут на его собственный адрес.
 */
export function GET() {
  return Response.redirect(EDU_URL, 307);
}
