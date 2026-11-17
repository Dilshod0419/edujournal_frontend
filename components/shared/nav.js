import {
  BarChart3, BookOpen, CalendarDays, ClipboardCheck, FileText, GraduationCap, Library,
  LayoutDashboard, School, Star, Users,
} from "lucide-react";

export const ROLE_HOME = {
  admin: "/admin/dashboard",
  teacher: "/teacher/dashboard",
  pupil: "/pupil/dashboard",
};

export const NAV = {
  admin: [
    { href: "/admin/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
    { href: "/admin/users", icon: Users, key: "nav.users" },
    { href: "/admin/academic", icon: School, key: "nav.academic" },
    { href: "/admin/schedules", icon: CalendarDays, key: "nav.schedules" },
  ],
  teacher: [
    { href: "/teacher/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
    { href: "/teacher/attendance", icon: ClipboardCheck, key: "nav.attendance" },
    { href: "/teacher/grades", icon: Star, key: "nav.grades" },
    { href: "/teacher/homeworks", icon: FileText, key: "nav.homeworks" },
    { href: "/teacher/materials", icon: Library, key: "nav.materials" },
    { href: "/teacher/statistics", icon: BarChart3, key: "nav.statistics" },
  ],
  pupil: [
    { href: "/pupil/dashboard", icon: LayoutDashboard, key: "nav.dashboard" },
    { href: "/pupil/schedules", icon: CalendarDays, key: "nav.schedule" },
    { href: "/pupil/homeworks", icon: FileText, key: "nav.homeworks" },
    { href: "/pupil/grades", icon: Star, key: "nav.my_grades" },
    { href: "/pupil/materials", icon: BookOpen, key: "nav.materials" },
  ],
};

export const BRAND_ICON = GraduationCap;
