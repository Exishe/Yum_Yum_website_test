# Strings for a native speaker to check before launch

The Russian and Armenian text was written natively, not machine-translated, but a native
speaker from Yerevan should read these before launch. JSON files cannot hold
`// REVIEW(native)` comments, so the list is here. Fix them in `messages/*.json` or in
Admin → Site texts.

## Armenian (hy) — read everything, with priority on:

| Key                         | Text                                       | What to check                                                                                                  |
| --------------------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| hero.titleA/B               | Մի՛ հանձնվիր, / դոնաթ կեր։                 | Tone and punctuation of the slogan.                                                                            |
| hero.craving                | դե ի՞նչ ես ուզում                          | Informal «դու» — OK for the brand?                                                                             |
| gifts.eyebrow               | ծաղիկները թառամում են, դոնաթները՝ ուտվում։ | Passive «ուտվում» sounds natural?                                                                              |
| story.title                 | Դոնաթների պատը։                            | Shop name removed (the photo is not confirmed as Abovyan); check the wording.                                  |
| story.page.*                | History paragraphs                         | Facts from the 2013 ԵՐԵՎԱՆ article; names Թորոս, Նունե Սահակյան.                                               |
| spotted.titleB              | YUM YUM-ում                                | Case ending on a Latin brand name.                                                                             |
| checkout.consent            | Համաձայն եմ…                               | Legal wording.                                                                                                 |
| legal.privacy / legal.terms | All                                        | Have a lawyer check against Armenian law on personal data (ՀՀ օրենք «Անձնական տվյալների պաշտպանության մասին»). |
| Product names               | `db/seed-data.ts`                          | «Ֆրաունի», «Շոկմանժե», «Բաունտի» — how the shop actually says them.                                            |
| districts                   | `lib/districts.ts`                         | Official spellings.                                                                                            |

## Russian (ru)

| Key                          | Text                         | What to check                                                  |
| ---------------------------- | ---------------------------- | -------------------------------------------------------------- |
| hero.titleA/B                | Не вешай нос — / бери донат. | Does the client like it more than «Не сдавайся — съешь донат»? |
| perks.shops, hero.shopsBadge | «7 кафе»                     | Or «7 точек»?                                                  |
| checkout.consent             | «Я согласен(на)…»            | Gender form.                                                   |
| gifts.box.left               | Plural forms                 | «Осталось 1 место / 2 места / 5 мест».                         |
| legal.*                      | All                          | Legal review.                                                  |
| Product names                | `db/seed-data.ts`            | «Пистачо Кинг», «Фрауни» — as on buy.am.                       |

## English (en)

Mostly fine; check product names match what is written in the shops.
