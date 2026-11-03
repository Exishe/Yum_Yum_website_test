import Image, { type ImageProps } from "next/image";
import type { ImageInfo } from "@/lib/images";

type Props = Omit<ImageProps, "src" | "width" | "height" | "placeholder" | "blurDataURL"> & {
  image: ImageInfo;
  fill?: boolean;
  /**
   * Width ÷ height of the box when the photo is cropped with object-cover.
   * A wide photo in a tall box shows only its middle, so it needs a bigger
   * file than the box width; without this it is upscaled and looks soft.
   */
  cover?: number;
  /**
   * Wrap the photo in a clipping frame that takes `className` (size, shape,
   * corners), so it can zoom out into place on reveal and zoom in on hover.
   */
  zoom?: boolean;
};

/** Scales each width in a `sizes` list (not the media queries) by `factor`. */
function scaleSizes(sizes: string, factor: number) {
  return sizes
    .split(",")
    .map((part) => {
      const cut = part.lastIndexOf(")") + 1;
      const value = part
        .slice(cut)
        .replace(
          /(\d+(?:\.\d+)?)(vw|px)/g,
          (_, n: string, u: string) => `${Math.ceil(Number(n) * factor)}${u}`,
        );
      return part.slice(0, cut) + value;
    })
    .join(",");
}

/** The tallest box shape among the aspect-* classes, e.g. "aspect-[3/4.6] lg:aspect-square". */
function aspectOf(className: string | undefined): number | undefined {
  const found = [
    ...(className ?? "").matchAll(/aspect-(square|\[(\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)\])/g),
  ].map((m) => (m[1] === "square" ? 1 : Number(m[2]) / Number(m[3])));
  return found.length ? Math.min(...found) : undefined;
}

/** next/image with the blur placeholder and intrinsic size from the manifest. */
export function Photo({ zoom, ...props }: Props) {
  if (!zoom) return <PhotoImage {...props} />;
  const { className, ...rest } = props;
  return (
    <span className={`zoom-frame ${className ?? ""}`}>
      <PhotoImage
        {...rest}
        cover={rest.cover ?? aspectOf(className)}
        className="zoom-photo size-full object-cover"
      />
    </span>
  );
}

function PhotoImage({ image, fill, alt, cover, sizes, quality = 85, ...rest }: Props) {
  const blur = image.blur ? { placeholder: "blur" as const, blurDataURL: image.blur } : {};
  const box = cover ?? aspectOf(rest.className);
  const factor = box ? Math.max(1, image.w / image.h / box) : 1;
  const fit = sizes && factor > 1 ? scaleSizes(sizes, factor) : sizes;
  return fill ? (
    <Image src={image.src} alt={alt} fill sizes={fit} quality={quality} {...blur} {...rest} />
  ) : (
    <Image
      src={image.src}
      alt={alt}
      width={image.w}
      height={image.h}
      sizes={fit}
      quality={quality}
      {...blur}
      {...rest}
    />
  );
}
