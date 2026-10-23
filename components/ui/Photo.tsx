import Image, { type ImageProps } from "next/image";
import type { ImageInfo } from "@/lib/images";

type Props = Omit<ImageProps, "src" | "width" | "height" | "placeholder" | "blurDataURL"> & {
  image: ImageInfo;
  fill?: boolean;
};

/** next/image with the blur placeholder and intrinsic size from the manifest. */
export function Photo({ image, fill, alt, ...rest }: Props) {
  const blur = image.blur ? { placeholder: "blur" as const, blurDataURL: image.blur } : {};
  return fill ? (
    <Image src={image.src} alt={alt} fill {...blur} {...rest} />
  ) : (
    <Image src={image.src} alt={alt} width={image.w} height={image.h} {...blur} {...rest} />
  );
}
