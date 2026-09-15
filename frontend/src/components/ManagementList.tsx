"use client";

import { useLocalizedList } from "@/lib/cms/use-localized";
import { managementByGroup, managementGroupIds, managementGroupTitles, paragraphs, type CmsManagementPerson } from "@/lib/cms/types";
import { useTr } from "@/lib/use-tr";
import ui from "@/app/ui.module.css";
import css from "@/app/about/management/management.module.css";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function Person({ person }: { person: CmsManagementPerson }) {
  const tr = useTr();
  const bio = paragraphs(person.bio);
  const education = paragraphs(person.education);

  return (
    <details className={css.person}>
      <summary className={css.head}>
        <span className={css.headText}>
          <b>{person.name}</b>
          <small>{person.role}</small>
        </span>
        <svg className={css.chevron} viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </summary>
      <div className={css.body}>
        <div className={css.portrait}>
          {person.photo ? (
            <img src={person.photo} alt={person.name} loading="lazy" />
          ) : (
            <span className={css.noPhoto} aria-hidden="true">
              {initials(person.name)}
            </span>
          )}
        </div>
        <div className={css.about}>
          <h3 className={css.personName}>{person.name}</h3>

          {bio.length ? (
            <div className={css.panel}>
              {bio.map((paragraph) => (
                <p key={paragraph.slice(0, 48)}>{paragraph}</p>
              ))}
            </div>
          ) : null}

          {education.length ? (
            <>
              <p className={css.subhead}>{tr("Образование")}</p>
              <div className={css.panel}>
                {education.map((paragraph) => (
                  <p key={paragraph.slice(0, 48)}>{paragraph}</p>
                ))}
              </div>
            </>
          ) : null}

          {person.career.length ? (
            <>
              <p className={css.subhead}>{tr("Трудовая деятельность")}</p>
              <div className={`${ui.tableWrap} ${css.career}`}>
                <table>
                  <tbody>
                    {person.career.map((row, index) => (
                      <tr key={`${row.org}-${row.period}-${index}`}>
                        <td>{row.org}</td>
                        <td>{row.role || "—"}</td>
                        <td>{row.period}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </details>
  );
}

export function ManagementList({ people }: { people: CmsManagementPerson[] }) {
  const tr = useTr();
  const rows = useLocalizedList(people, ["name", "role", "bio", "education"]);

  if (!rows.length) return <p className={css.empty}>{tr("Состав руководства скоро появится.")}</p>;

  return (
    <>
      {managementGroupIds.map((group) => {
        const members = managementByGroup(rows, group);
        if (!members.length) return null;
        return (
          <section className={css.group} key={group} aria-labelledby={`mgmt-${group}`}>
            <h2 id={`mgmt-${group}`}>{tr(managementGroupTitles[group])}</h2>
            <div className={css.people}>
              {members.map((person) => (
                <Person key={person.slug} person={person} />
              ))}
            </div>
          </section>
        );
      })}
    </>
  );
}
