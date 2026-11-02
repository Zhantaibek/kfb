import type { ImgHTMLAttributes } from "react";

/**
 * Картинка из медиатеки CMS (/uploads, отдаёт backend). Размер заранее неизвестен, оптимизатор next/image
 * для этих адресов не настроен — поэтому обычный <img>, по умолчанию с ленивой загрузкой.
 */
export function CmsImage({ alt = "", loading = "lazy", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element -- см. комментарий выше
  return <img alt={alt} loading={loading} {...props} />;
}
