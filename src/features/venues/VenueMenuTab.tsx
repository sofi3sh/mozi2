"use client";

import Link from "next/link";

export default function VenueMenuTab({ cityId, venueId }: { cityId: string; venueId: string }) {
  return (
    <div style={boxStyle}>
      <div style={{ fontWeight: 900, marginBottom: 6 }}>Меню</div>
      <div style={{ color: "var(--muted)" }}>
        Заглушка. Наступним кроком додамо категорії/страви/модифікатори для закладу.
      </div>

      <div style={{ marginTop: 12 }}>
        <Link href={`/admin/c/${cityId}/venues/${venueId}/edit`} style={editLinkStyle}>
          Редагувати заклад →
        </Link>
      </div>
    </div>
  );
}

const boxStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  background: "var(--panel)",
  borderRadius: 12,
  padding: 14,
};

const editLinkStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: 10,
  border: "1px solid rgba(59,130,246,0.45)",
  background: "rgba(59,130,246,0.12)",
  fontWeight: 900,
  display: "inline-block",
};
