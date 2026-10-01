'use client';

import React from 'react';
import Image, { ImageProps } from 'next/image';

type BaseImageProps = Omit<ImageProps, 'alt'>;

export type ImgProps =
  | (BaseImageProps & {
      alt: string;
      decorative?: false;
    })
  | (BaseImageProps & {
      alt?: '';
      decorative: true;
    });

/**
 * Accessible Image wrapper around Next.js Image.
 * Strictly enforces either a meaningful non-empty alt text or explicit decorative: true.
 */
export default function Img(props: ImgProps) {
  if (props.decorative) {
    const { decorative: _d, ...rest } = props;
    return <Image {...rest} alt="" aria-hidden="true" />;
  }

  return <Image {...props} alt={props.alt} />;
}
