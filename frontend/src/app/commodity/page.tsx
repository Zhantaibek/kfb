import { redirect } from "next/navigation";

/** Товарно-сырьевой сектор — отдельная площадка ts.kse.kg (как на старом сайте); старые ссылки /commodity ведут туда. */
export default function CommodityPage() {
  redirect("https://ts.kse.kg/");
}
