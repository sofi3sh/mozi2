"use client";

import React from "react";
import NextLink from "next/link";
import type { LinkProps } from "next/link";
import { useSiteLang } from "@/store/siteLang";
import { withLangPrefix } from "@/lib/lang";

type Props = Omit<React.ComponentProps<typeof NextLink>, "href"> & {
  href: string;
};

/**
 * Next <Link> that automatically prefixes internal links with the current language route ("/ua" or "/ru").
 * Prevents unnecessary middleware redirects and keeps SEO-friendly localized URLs.
 */
export default function LangLink({ href, ...rest }: Props) {
  const { lang } = useSiteLang();
  const nextHref = withLangPrefix(href, lang);
  return <NextLink href={nextHref as LinkProps["href"]} {...rest} />;
}
