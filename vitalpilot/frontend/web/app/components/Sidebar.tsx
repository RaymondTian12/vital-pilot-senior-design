"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

import { MdOutlineDashboardCustomize } from "react-icons/md";
import { TbHeartPlus } from "react-icons/tb";
import { TbReport } from "react-icons/tb";
import { IoNotificationsOutline } from "react-icons/io5";
import { IoSettingsOutline } from "react-icons/io5";
import { GoShieldCheck } from "react-icons/go";
import { div } from "motion/react-client";

const Sidebar = () => {
  const pathname = usePathname();

  const links = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <MdOutlineDashboardCustomize />,
    },
    {
      name: "Vitals",
      href: "/dashboard/vitals",
      icon: <TbHeartPlus />,
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: <TbReport />,
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: <IoNotificationsOutline />,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <IoSettingsOutline />,
    },
    {
      name: "Security & Privacy",
      href: "/dashboard/security",
      icon: <GoShieldCheck />,
    },
  ];
  return (
    <div className="flex items-center flex-col w-60 border-r border-ai shadow-sm ">
      <Link href="/" className="mt-2 mb-5">
        <Image
          src="/assets/logo_hero.png"
          alt="Vitalpilot"
          width={120}
          height={120}
          className="-translate-x-5"
        />
      </Link>
      <div className="">
        {links.map((link) => {
          let active = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg pl-3 py-3 mb-5 w-50 font-semibold ${active ? "bg-fourth/30 text-main" : "hover:bg-ai/50"}`}
            >
              {link.icon}
              {link.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default Sidebar;
