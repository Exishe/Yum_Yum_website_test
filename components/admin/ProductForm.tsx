import Image from "next/image";
import { Card, Check, Field, LocalizedField, SubmitButton, inputCls } from "@/components/admin/ui";
import type { Category, Product, ProductOption } from "@/db/schema";
import { OptionsEditor } from "./OptionsEditor";
import { saveProductAction } from "@/app/admin/actions";
import { adminT } from "@/lib/admin-lang";
import { PhotoInput } from "./PhotoInput";

export async function ProductForm({
  product,
  options,
  categories,
}: {
  product?: Product;
  options: ProductOption[];
  categories: Category[];
}) {
  const t = await adminT();
  return (
    <form action={saveProductAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <Card className="flex flex-col gap-4">
        <LocalizedField label={t("Name")} name="name" value={product?.name} required />
        <LocalizedField
          label={t("Short description")}
          name="description"
          value={product?.description}
          multiline
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="block text-sm font-semibold">
            {t("Category")}
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? categories[0]?.id}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name[t.lang] || c.name.en}
                </option>
              ))}
            </select>
          </label>
          <Field
            label={t("Price, ֏")}
            name="priceAmd"
            type="number"
            min={0}
            step={10}
            defaultValue={product?.priceAmd}
            required
          />
          <Field
            label={t("Order days ahead")}
            name="leadTimeDays"
            type="number"
            min={0}
            max={14}
            defaultValue={product?.leadTimeDays ?? 0}
            hint="1 for bouquets and name donuts"
          />
          <Field
            label={t("Sort order")}
            name="sortOrder"
            type="number"
            defaultValue={product?.sortOrder ?? 0}
          />
          <Field
            label={t("Filter tags")}
            name="tags"
            defaultValue={product?.tags.join(", ")}
            hint={t("glazed, chocolate, fruity, filled, kids, iced, hot, savoury, gifts")}
            className="md:col-span-2"
          />
          <Field
            label={t("Badges")}
            name="badges"
            defaultValue={product?.badges.join(", ")}
            hint={t("new, bestseller")}
          />
          <Field
            label={t("Box size")}
            name="boxSize"
            type="number"
            min={0}
            max={12}
            defaultValue={product?.boxSize ?? ""}
            hint={t("Only for 'pack your box' boxes")}
          />
        </div>
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          <Check
            label={t("Shown on the website")}
            name="isPublished"
            defaultChecked={product?.isPublished ?? true}
          />
          <Check
            label={t("In stock today")}
            name="isAvailable"
            defaultChecked={product?.isAvailable ?? true}
          />
          <Check
            label={t("Featured")}
            name="isFeatured"
            defaultChecked={product?.isFeatured}
            hint={t("Big photo in its category")}
          />
          <Check
            label={t("Price not yet confirmed")}
            name="priceIsSample"
            defaultChecked={product?.priceIsSample ?? false}
          />
          <Check
            label={t("Price on request")}
            name="priceOnRequest"
            defaultChecked={product?.priceOnRequest ?? false}
            hint={t("The product is hidden from the website until you set its price")}
          />
        </div>
        <Field
          label={t("Same product on buy.am (optional)")}
          name="buyamUrl"
          type="url"
          defaultValue={product?.buyamUrl ?? ""}
          placeholder="https://buy.am/products/yum-yum-donuts/…"
          hint={t("Shows an “Order on buy.am” link on the product")}
        />
      </Card>
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-5">
          <span className="relative size-32 shrink-0 overflow-hidden rounded-2xl bg-magenta-soft">
            {product?.image ? (
              <Image src={product.image} alt="" fill sizes="128px" className="object-cover" />
            ) : null}
          </span>
          <div className="flex flex-col gap-2">
            <PhotoInput label={t("New photo (JPEG, PNG, WebP)")} />
            <p className="text-xs text-muted">
              {t(
                "Only real photos of YUM-YUM products. Large photos are made smaller automatically.",
              )}
            </p>
            {product?.image ? <Check label={t("Remove the photo")} name="removeImage" /> : null}
          </div>
        </div>
        <LocalizedField
          label={t("Photo description for screen readers")}
          name="imageAlt"
          value={product?.imageAlt}
        />
      </Card>
      <Card>
        <OptionsEditor
          initial={options.map((o) => ({
            kind: o.kind,
            name: o.name,
            priceDeltaAmd: o.priceDeltaAmd,
            isDefault: o.isDefault,
            maxLength: o.maxLength,
          }))}
        />
      </Card>
      <div>
        <SubmitButton className="h-12 px-8">{t("Save product")}</SubmitButton>
      </div>
    </form>
  );
}
