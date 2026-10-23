import Image from "next/image";
import { Card, Check, Field, LocalizedField, SubmitButton, inputCls } from "@/components/admin/ui";
import type { Category, Product, ProductOption } from "@/db/schema";
import { OptionsEditor } from "./OptionsEditor";
import { saveProductAction } from "@/app/admin/actions";

export function ProductForm({
  product,
  options,
  categories,
}: {
  product?: Product;
  options: ProductOption[];
  categories: Category[];
}) {
  return (
    <form action={saveProductAction} className="flex flex-col gap-5">
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <Card className="flex flex-col gap-4">
        <LocalizedField label="Name" name="name" value={product?.name} required />
        <LocalizedField
          label="Short description"
          name="description"
          value={product?.description}
          multiline
        />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <label className="block text-sm font-semibold">
            Category
            <select
              name="categoryId"
              defaultValue={product?.categoryId ?? categories[0]?.id}
              className={inputCls}
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name.en}
                </option>
              ))}
            </select>
          </label>
          <Field
            label="Price, ֏"
            name="priceAmd"
            type="number"
            min={0}
            step={10}
            defaultValue={product?.priceAmd}
            required
          />
          <Field
            label="Order days ahead"
            name="leadTimeDays"
            type="number"
            min={0}
            max={14}
            defaultValue={product?.leadTimeDays ?? 0}
            hint="1 for bouquets and name donuts"
          />
          <Field
            label="Sort order"
            name="sortOrder"
            type="number"
            defaultValue={product?.sortOrder ?? 0}
          />
          <Field
            label="Filter tags"
            name="tags"
            defaultValue={product?.tags.join(", ")}
            hint="glazed, chocolate, fruity, filled, kids, iced, hot, savoury, gifts"
            className="md:col-span-2"
          />
          <Field
            label="Badges"
            name="badges"
            defaultValue={product?.badges.join(", ")}
            hint="new, bestseller"
          />
          <Field
            label="Box size"
            name="boxSize"
            type="number"
            min={0}
            max={12}
            defaultValue={product?.boxSize ?? ""}
            hint="Only for 'pack your box' boxes"
          />
        </div>
        <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2 lg:grid-cols-4">
          <Check
            label="Shown on the website"
            name="isPublished"
            defaultChecked={product?.isPublished ?? true}
          />
          <Check
            label="In stock today"
            name="isAvailable"
            defaultChecked={product?.isAvailable ?? true}
          />
          <Check
            label="Featured"
            name="isFeatured"
            defaultChecked={product?.isFeatured}
            hint="Big photo in its category"
          />
          <Check
            label="Price not yet confirmed"
            name="priceIsSample"
            defaultChecked={product?.priceIsSample ?? false}
          />
        </div>
      </Card>
      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start gap-5">
          <span className="relative size-32 shrink-0 overflow-hidden rounded-2xl bg-magenta-soft">
            {product?.image ? (
              <Image src={product.image} alt="" fill sizes="128px" className="object-cover" />
            ) : null}
          </span>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold">
              New photo (JPEG, PNG, WebP; up to 5 MB)
              <input
                type="file"
                name="imageFile"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="mt-1 block text-sm"
              />
            </label>
            <p className="text-xs text-muted">
              Only real photos of YUM-YUM products. We resize and clean the file automatically.
            </p>
            {product?.image ? <Check label="Remove the photo" name="removeImage" /> : null}
          </div>
        </div>
        <LocalizedField
          label="Photo description for screen readers"
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
        <SubmitButton className="h-12 px-8">Save product</SubmitButton>
      </div>
    </form>
  );
}
