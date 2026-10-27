-- Armenian names now follow YUM-YUM's own wording on buy.am ("Դոնաթով փունջ", "Յամ դոնաթ", "գլազուր").
-- Only rows still holding the old seed text change; anything edited in the admin is kept.
UPDATE "categories" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Դասական և հեղինակային դոնաթներ՝ գլազուրով և միջուկով։'::text)) WHERE "description"->>'hy' = 'Դասական և հեղինակային դոնաթներ՝ ջնարակով և միջուկով։';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Մուգ շոկոլադե գլազուր'::text)) WHERE "description"->>'hy' = 'Մուգ շոկոլադե ջնարակ';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Շոկոլադե գլազուր և գունավոր ցողիկներ'::text)) WHERE "description"->>'hy' = 'Շոկոլադե ջնարակ և գունավոր ցողիկներ';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Կարամելային գլազուր'::text)) WHERE "description"->>'hy' = 'Կարամելային ջնարակ';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Սպիտակ շոկոլադե գլազուր'::text)) WHERE "description"->>'hy' = 'Սպիտակ շոկոլադե ջնարակ';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Վարդագույն ելակային գլազուր'::text)) WHERE "description"->>'hy' = 'Վարդագույն ելակային ջնարակ';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Դեղձային գլազուր և ցողիկներ'::text)) WHERE "description"->>'hy' = 'Դեղձային ջնարակ և ցողիկներ';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Կապույտ գլազուր և ցողիկներ'::text)) WHERE "description"->>'hy' = 'Կապույտ ջնարակ և ցողիկներ';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Մաստակի համով գլազուր'::text)) WHERE "description"->>'hy' = 'Մաստակի համով ջնարակ';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Կիտրոնային գլազուր'::text)) WHERE "description"->>'hy' = 'Կիտրոնային ջնարակ';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Շոկոլադե միջուկ, կարամելային գլազուր'::text)) WHERE "description"->>'hy' = 'Շոկոլադե միջուկ, կարամելային ջնարակ';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Յամ դոնաթ բավարական կրեմով և շոկոլադով'::text)) WHERE "name"->>'hy' = 'Յամ-դոնաթ բավարական կրեմով';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Յամ դոնաթ բավարական կրեմով և կարամելով'::text)) WHERE "name"->>'hy' = 'Յամ-դոնաթ կրեմ և կարամել';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Յամ դոնաթ «Բալ»'::text)) WHERE "name"->>'hy' = 'Յամ-դոնաթ բալով';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Յամ դոնաթ սպիտակ շոկոլադով և ելակով'::text)) WHERE "name"->>'hy' = 'Յամ-դոնաթ ելակով';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Յամ դոնաթ շոկոլադով և կարամելով'::text)) WHERE "name"->>'hy' = 'Յամ-դոնաթ շոկոլադ-կարամել';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Յամ դոնաթ կրկնակի շոկոլադով'::text)) WHERE "name"->>'hy' = 'Յամ-դոնաթ կրկնակի շոկոլադ';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{ru}', to_jsonb('Ям-донат с баварским кремом и шоколадом'::text)) WHERE "name"->>'ru' = 'Ям-донат с баварским кремом';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{ru}', to_jsonb('Ям-донат с баварским кремом и карамелью'::text)) WHERE "name"->>'ru' = 'Ям-донат крем и карамель';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Անվանական դոնաթ'::text)) WHERE "name"->>'hy' = 'Անունով դոնաթ';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{ru}', to_jsonb('Именной донат'::text)) WHERE "name"->>'ru' = 'Донат с именем';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Ցանկացած անուն կամ կարճ մաղթանք դոնաթի վրա'::text)) WHERE "description"->>'hy' = 'Ցանկացած անուն կամ բառ՝ գրված ջնարակով';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Դոնաթներից տորթ «Happy Birthday»'::text)) WHERE "name"->>'hy' = 'Ծննդյան դոնաթե աշտարակ';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{ru}', to_jsonb('Торт из донатов «Happy Birthday»'::text)) WHERE "name"->>'ru' = 'Именинная башня из донатов';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{en}', to_jsonb('Happy Birthday donut cake'::text)) WHERE "name"->>'en' = 'Birthday donut stack';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Ցողիկներով դոնաթներ՝ ոսկեգույն «Happy Birthday» զարդով'::text)) WHERE "description"->>'hy' = 'Դոնաթե աշտարակ «Happy Birthday» թոփերով';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Դոնաթով կոմպոզիցիա N' || substr("name"->>'hy', 13))) WHERE "name"->>'hy' LIKE 'Կոմպոզիցիա N%';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{ru}', to_jsonb('Композиция из донатов N' || substr("name"->>'ru', 13))) WHERE "name"->>'ru' LIKE 'Композиция N%';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{en}', to_jsonb('Donut composition N' || substr("name"->>'en', 14))) WHERE "name"->>'en' LIKE 'Composition N%';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Դոնաթով փունջ N' || substr("name"->>'hy', 20))) WHERE "name"->>'hy' LIKE 'Դոնաթե ծաղկեփունջ N%';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Պիստաչո Քինգ'::text)) WHERE "name"->>'hy' = 'Պիստակ Քինգ';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Սպիտակ շոկոլադով դոնաթ'::text)) WHERE "name"->>'hy' = 'Սպիտակ շոկոլադով';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Կիտրոնային դոնաթ'::text)) WHERE "name"->>'hy' = 'Կիտրոնային';
--> statement-breakpoint
UPDATE "products" SET "description" = jsonb_set("description", '{hy}', to_jsonb('Ամերիկյան դրոշի գույներով'::text)) WHERE "description"->>'hy' = 'Մեր ամերիկյան արմատների համար';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Լոնգ Ջոն բավարական կրեմով և շոկոլադով'::text)) WHERE "name"->>'hy' = 'Լոնգ Ջոն բավարական կրեմով';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('Լոնգ Ջոն շոկոլադե միջուկով և կարամելով'::text)) WHERE "name"->>'hy' = 'Լոնգ Ջոն շոկոլադ-կարամել';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('6 հատանոց տուփ'::text)) WHERE "name"->>'hy' = 'Տուփ 6 դոնաթի համար';
--> statement-breakpoint
UPDATE "products" SET "name" = jsonb_set("name", '{hy}', to_jsonb('12 հատանոց տուփ'::text)) WHERE "name"->>'hy' = 'Տուփ 12 դոնաթի համար';
