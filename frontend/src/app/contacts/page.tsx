import type { Metadata } from "next";
import { ContactsIntro } from "@/components/ContactsIntro";
import { CmsSection } from "@/components/CmsSection";
import { FeedbackForm } from "@/components/Forms";
import { mailHref, splitLines, telHref } from "@/lib/cms/contacts";
import { findPageByPath, loadPublicContent } from "@/lib/cms/public";
import ui from "@/app/ui.module.css";
import { PublicMain } from "@/components/PublicMain";

export const metadata: Metadata = { title: "Контакты" };

export default async function ContactsPage() {
  const content = await loadPublicContent();
  const { settings } = content;
  // Телефоны и почта отделов — страница /contacts в админке (перенесена с kse.kg).
  const departments = findPageByPath(content, "/contacts");
  const phones = splitLines(settings.phones);
  const emails = splitLines(settings.emails);

  return (
    <PublicMain>
      <ContactsIntro settings={settings} />
      <div className={ui.grid}>
        <article className={ui.card}>
          <h2>Телефоны</h2>
          {phones.map((phone) => (
            <p key={phone}>
              <a href={telHref(phone)}>{phone}</a>
            </p>
          ))}
          {settings.fax ? <p>Факс: {settings.fax}</p> : null}
          {emails.map((email) => (
            <p key={email}>
              <a href={mailHref(email)}>{email}</a>
            </p>
          ))}
          {settings.disclosurePhone ? <p>Раскрытие информации: {settings.disclosurePhone}</p> : null}
        </article>
        <FeedbackForm
          title="Написать в КФБ"
          fields={[
            { name: "name", label: "Имя", required: true },
            { name: "email", label: "E-mail", type: "email", required: true },
            { name: "message", label: "Сообщение", type: "textarea", required: true },
          ]}
          success="Сообщение принято. В этой версии сайта письмо не отправляется — для срочных вопросов звоните в офис."
        />
      </div>
      <CmsSection page={departments} title="По подразделениям" />
    </PublicMain>
  );
}
