# Strings for a native speaker to check before launch

The Russian and Armenian text was written natively, not machine-translated, but a native
speaker from Yerevan should read these before launch. JSON files cannot hold
`// REVIEW(native)` comments, so the list is here. Fix them in `messages/*.json` or in
Admin → Site texts.

## Armenian (hy) — read everything, with priority on:

Spell-checkers were tried (Hunspell hy_AM): the dictionary uses the old «եւ» spelling and
rejects ordinary word forms, so it is not useful here. The text was instead rewritten from
YUM-YUM's own Armenian (4u.am profile, buy.am product names, the 2013 ԵՐԵՎԱՆ article). A
native speaker should still read it once.

| Key                         | Text                                    | What to check                                                                                                  |
| --------------------------- | --------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| hero.titleA/B, hero.tagline | Ամենահամեղ / դոնաթները                  | Taken from their own description. Does the client want a different slogan?                                     |
| hero.lead, story.body       | Their 4u.am description                 | Lightly shortened; check it still reads as theirs.                                                             |
| story.page.lead             | «…դուրս գալիս մութ ու ցուրտ տարիներից…» | From the 2013 article. Keep, or leave the 90s out?                                                             |
| story.page.p3/p4            | «Յամ», «Յամ-Յամ»                        | The nickname as the article writes it.                                                                         |
| spotted.titleB              | YUM-YUM-ում                             | Case ending on a Latin brand name.                                                                             |
| checkout.consent            | Համաձայն եմ…                            | Legal wording.                                                                                                 |
| legal.privacy / legal.terms | All                                     | Have a lawyer check against Armenian law on personal data (ՀՀ օրենք «Անձնական տվյալների պաշտպանության մասին»). |
| Product names               | `db/seed-data.ts`                       | Follow buy.am. Check «Ֆրաունի», «Շոկմանժե», «Բաունտի», «Պիստաչո Քինգ»: how the shop says them.                 |
| districts                   | `lib/districts.ts`                      | Official spellings.                                                                                            |

## Russian (ru)

| Key              | Text                 | What to check                                                               |
| ---------------- | -------------------- | --------------------------------------------------------------------------- |
| hero.titleA/B    | Вкуснейшие / донаты. | From their RU description. Client chose «донаты» over «пончики» (Oct 2026). |
| checkout.consent | «Я согласен(на)…»    | Gender form.                                                                |
| gifts.box.left   | Plural forms         | «Осталось 1 место / 2 места / 5 мест».                                      |
| legal.*          | All                  | Legal review.                                                               |
| Product names    | `db/seed-data.ts`    | «Пистачо Кинг», «Фрауни» — as on buy.am.                                    |

## English (en)

Mostly fine; check product names match what is written in the shops.
