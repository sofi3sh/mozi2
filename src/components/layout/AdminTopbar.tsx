"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "@/store/session";
import { useCityScope } from "@/store/cityScope";
import { Select, SecondaryButton } from "@/components/ui/Input";
import { MenuIcon } from "@/components/icons/Icons";

export default function AdminTopbar({
  onToggleSidebar,
  onNavigate,
  onToggleCollapsed,
  sidebarCollapsed,
}: {
  onToggleSidebar?: () => void;
  onNavigate?: () => void;
  onToggleCollapsed?: () => void;
  sidebarCollapsed?: boolean;
}) {
  const router = useRouter();
  const { user, logout } = useSession();
  const { cities, currentCityId, setCurrentCityId, lastCityId } = useCityScope();

  const safeLast = lastCityId && cities.some((c) => c.id === lastCityId) ? lastCityId : null;
  const selected = currentCityId ?? safeLast ?? "";

  return (
    <header className="adminTopbar">
      <div className="adminTopbarLeft">
        <button type="button" className="adminBurger" onClick={onToggleSidebar} aria-label="Toggle sidebar">
          <MenuIcon size={20} />
        </button>

        <div className="adminTopTitle">Адмін-панель</div>

        <div className="adminTopSeparator" aria-hidden />

        <div className="adminCitySelect">
          <div className="adminCityLabel">Місто</div>
          <Select
            value={selected}
            onChange={(e) => {
              const id = e.target.value;
              setCurrentCityId(id);
              router.push(id ? `/admin/c/${id}` : `/admin/cities`);
              onNavigate?.();
            }}
            className="adminCitySelectField"
          >
            <option value="">— оберіть місто —</option>
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="adminTopbarRight">
        {/* Desktop-only sidebar collapse */}
        <SecondaryButton
          type="button"
          onClick={() => onToggleCollapsed?.()}
          className="adminCollapseToggle"
          title={sidebarCollapsed ? "Показати меню" : "Сховати меню"}
        >
          {sidebarCollapsed ? "Показати меню" : "Сховати меню"}
        </SecondaryButton>

        <Link href="/" className="adminTopLink" target="_blank" rel="noreferrer">
          На сайт ↗
        </Link>

        <div className="adminUserChip">
          <div className="adminUserAvatar" aria-hidden>
            {user.name?.slice(0, 1)?.toUpperCase() ?? "U"}
          </div>
          <div className="adminUserText">
            <div className="adminUserName">{user.name}</div>
            <div className="adminUserRole">{user.role}</div>
          </div>
        </div>

        <SecondaryButton type="button" onClick={logout} className="adminLogoutBtn">
          Вийти
        </SecondaryButton>
      </div>
    </header>
  );
}
