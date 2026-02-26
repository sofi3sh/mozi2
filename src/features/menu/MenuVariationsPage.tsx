"use client";

import React, { useMemo } from "react";
import { useMenu } from "@/store/menu";
import { VariationGroupsManager } from "@/features/menu/MenuDishesPage";

function isVariationGroupTitle(title: string) {
  return String(title || "").startsWith("VAR::");
}

export default function MenuVariationsPage({ cityId, venueId }: { cityId: string; venueId: string }) {
  const { getGroups } = useMenu();
  const allGroups = getGroups(cityId, venueId);

  const variationGroups = useMemo(() => allGroups.filter((g) => isVariationGroupTitle(g.title)), [allGroups]);

  return (
    <div className="ui-grid">
      <VariationGroupsManager cityId={cityId} venueId={venueId} variationGroups={variationGroups} />
    </div>
  );
}

