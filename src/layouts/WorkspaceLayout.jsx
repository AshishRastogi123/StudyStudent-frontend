import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Bell, BookOpen, BookMarked, ChevronDown, ChevronLeft, Compass, LayoutDashboard,
  FileStack, LogOut, Menu, Moon, PanelLeftClose, PanelLeftOpen, Settings, Shield,
  Sun, UploadCloud, Users, X,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "sonner";
import { clearSession } from "../features/auth/authSlice";
import { authApi, errorMessage, notificationsApi } from "../services/api";

const studentItems = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/notes", label: "My notes", icon: BookOpen },
  { to: "/app/bookmarks", label: "Bookmarks", icon: BookMarked },
  { to: "/app/academic", label: "Academic paths", icon: Compass },
  { to: "/app/settings", label: "Account settings", icon: Settings },
];

export default function WorkspaceLayout() {
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("studystudent_theme") === "dark");
  const [unread, setUnread] = useState(0);
  const privileged = ["ADMIN", "MODERATOR"].includes(user?.role);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("studystudent_theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    let active = true;
    notificationsApi.list().then(({ data }) => {
      if (active) setUnread(data.unreadCount || 0);
    }).catch((error) => {
      if (active) toast.error(errorMessage(error));
    });
    return () => { active = false; };
  }, []);

  const logout = async () => {
    try { await authApi.logout(); } catch (error) { toast.error(errorMessage(error)); }
    dispatch(clearSession());
    navigate("/");
  };

  const navClass = ({ isActive }) => `sidebar-link${isActive ? " sidebar-link-active" : ""}`;
  const closeMobile = () => setMobileOpen(false);

  return (
    <div className={`workspace ${collapsed ? "workspace-collapsed" : ""}`}>
      {mobileOpen && <button className="mobile-scrim" onClick={closeMobile} aria-label="Close navigation" />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-mobile-open" : ""}`}>
        <div className="sidebar-brand">
          <Link to="/" className="brand"><span className="brand-mark"><BookOpen size={19} /></span>{!collapsed && <span>Study<span className="brand-accent">Student</span></span>}</Link>
          <button className="icon-button mobile-close" onClick={closeMobile} aria-label="Close sidebar"><X size={18} /></button>
          <button className="icon-button collapse-toggle" onClick={() => setCollapsed(!collapsed)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}</button>
        </div>
        <div className="sidebar-scroll">
          <p className="sidebar-section-label">{!collapsed && "Workspace"}</p>
          <nav className="sidebar-nav">
            {studentItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={navClass} title={collapsed ? label : undefined} onClick={closeMobile}><Icon size={18} /><span>{label}</span></NavLink>)}
            <NavLink to="/app/notifications" className={navClass} title={collapsed ? "Notifications" : undefined} onClick={closeMobile}><Bell size={18} /><span>Notifications</span>{unread > 0 && <span className="sidebar-count">{unread}</span>}</NavLink>
          </nav>
          {privileged && <>
            <p className="sidebar-section-label">{!collapsed && "Moderation"}</p>
            <nav className="sidebar-nav">
              <NavLink to="/admin" end className={navClass} title={collapsed ? "Admin overview" : undefined} onClick={closeMobile}><Shield size={18} /><span>Admin overview</span></NavLink>
              <NavLink to="/admin/review" className={navClass} title={collapsed ? "Review queue" : undefined} onClick={closeMobile}><UploadCloud size={18} /><span>Review queue</span></NavLink>
              <NavLink to="/admin/notes" className={navClass} title={collapsed ? "All notes" : undefined} onClick={closeMobile}><FileStack size={18} /><span>All notes</span></NavLink>
              <NavLink to="/admin/reports" className={navClass} title={collapsed ? "Reports" : undefined} onClick={closeMobile}><Bell size={18} /><span>Reports</span></NavLink>
              {user.role === "ADMIN" && <>
                <NavLink to="/admin/users" className={navClass} title={collapsed ? "Manage users" : undefined} onClick={closeMobile}><Users size={18} /><span>Manage users</span></NavLink>
                <NavLink to="/admin/academic" className={navClass} title={collapsed ? "Manage academics" : undefined} onClick={closeMobile}><Settings size={18} /><span>Manage academics</span></NavLink>
              </>}
            </nav>
          </>}
        </div>
        <div className="sidebar-bottom">
          <Link to="/library" className="sidebar-link" title={collapsed ? "Public library" : undefined}><Compass size={18} /><span>Public library</span></Link>
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="profile-trigger" title={collapsed ? user?.name : undefined}>
                <span className="avatar">{(user?.name || "S").slice(0, 1).toUpperCase()}</span>
                <span className="profile-trigger-text"><strong>{user?.name}</strong><small>{user?.role?.toLowerCase()}</small></span><ChevronDown size={16} />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content className="dropdown-content" side="top" align="start">
                <DropdownMenu.Item className="dropdown-item" onSelect={() => setDark(!dark)}>{dark ? <Sun size={16} /> : <Moon size={16} />}{dark ? "Light theme" : "Dark theme"}</DropdownMenu.Item>
                <DropdownMenu.Item className="dropdown-item danger-text" onSelect={logout}><LogOut size={16} />Sign out</DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </aside>
      <main className="workspace-main">
        <header className="workspace-topbar">
          <button className="icon-button mobile-open" onClick={() => setMobileOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <div className="topbar-breadcrumb"><Link to="/">StudyStudent</Link><ChevronLeft size={14} className="crumb-chevron" /><span>Workspace</span></div>
          <div className="topbar-actions"><Link to="/app/notifications" className="icon-button topbar-bell" aria-label="Notifications"><Bell size={18} />{unread > 0 && <i />}</Link><span className="topbar-greeting">Welcome, {user?.name?.split(" ")[0]}</span></div>
        </header>
        <div className="workspace-content"><Outlet /></div>
      </main>
    </div>
  );
}
