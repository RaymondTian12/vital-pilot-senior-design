"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { IoNotificationsOutline } from "react-icons/io5";
import { MdLockOutline } from "react-icons/md";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { FaUserDoctor } from "react-icons/fa6";
import { IoIosArrowForward } from "react-icons/io";
import { api, AuthUser, CareTeamProvider, DailySummaryResponse } from "../services/api";

const STATUS_STYLES: Record<DailySummaryResponse["overall_result"]["status"], string> = {
  urgent: "bg-red-50 text-red-600 border-red-200",
  needs_review: "bg-amber-50 text-amber-600 border-amber-200",
  incomplete: "bg-gray-50 text-gray-600 border-gray-200",
  no_alerts: "bg-fourth/30 text-main border-main/30",
};

const Dashboard = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [summary, setSummary] = useState<DailySummaryResponse | null>(null);
  const [careTeam, setCareTeam] = useState<CareTeamProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.getMe(), api.getDailySummary(), api.getCareTeam()])
      .then(([meResult, summaryResult, careTeamResult]) => {
        if (cancelled) return;
        setUser(meResult);
        setSummary(summaryResult);
        setCareTeam(careTeamResult);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const result = summary?.overall_result;
  const topAlert = result
    ? [...result.urgent_readings, ...result.warning_readings][0]
    : undefined;

  return (
    <div className="flex justify-between flex-col h-full">
      <div className="flex justify-between my-8 w-[90%] mx-auto">
        <div>
          <h3 className="font-bold mb-2">
            Welcome back{user?.firstname ? `, ${user.firstname}` : ""}
          </h3>
          <p className="font-medium text-gray-500">
            Here&apos;s your health overview for today.
          </p>
        </div>

        <div className="flex items-start gap-10">
          <IoNotificationsOutline className="mt-2 font-bold text-[24px]" />
          <div className="flex items-center gap-3">
            <div className="rounded-full w-10 h-10 bg-blue-50" />
            <div>
              {user ? `${user.firstname} ${user.lastname}` : "first last"}
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-[90%] mx-auto gap-y-5 mb-10">
        <div className="vitals">
          {loading ? (
            <div className="h-16 rounded-xl bg-fourth/10 animate-pulse" />
          ) : error || !result ? (
            <div className="rounded-xl border border-ai px-5 py-4 text-gray-500 text-[14px]">
              Your daily summary couldn&apos;t be loaded. Please try again later.
            </div>
          ) : (
            <div className={`rounded-xl border px-5 py-4 ${STATUS_STYLES[result.status]}`}>
              <p className="font-bold">{result.title}</p>
              <p className="text-[14px] mt-1">{result.message}</p>
              <p className="text-[13px] mt-2 opacity-80">
                {result.logged_metric_count} metric{result.logged_metric_count === 1 ? "" : "s"} logged today
                {result.missing_health_metrics.length > 0 &&
                  ` · ${result.missing_health_metrics.length} not yet logged`}
              </p>
            </div>
          )}
        </div>
        <div className="summary flex gap-x-5 ">
          <div className="flex items-center justify-around basis-[70%] h-80 p-10 shadow-sm border border-ai rounded-xl bg-fourth/30">
            <div className="flex flex-col w-[400] h-full">
              <h4 className="font-bold text-lg flex items-center gap-2 mb-5">
                <Image
                  src="/assets/ai_green.png"
                  width={240}
                  height={240}
                  alt=""
                  className="w-5 h-5"
                />{" "}
                Pilot AI Insight
              </h4>
              <p className="font-semibold text-justify leading-relaxed indent-10">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus
                doloribus saepe sunt officia deleniti sint. Assumenda, iure.
                Architecto illo aut atque amet, ipsam sed reiciendis harum. Sit
                architecto consequatur assumenda cupiditate cumque veritatis sed
                perferendis unde officiis ullam! Labore obcaecati modi quae
                nulla.
              </p>
            </div>
            <div className="flex-center">
              <Image
                src="/assets/chatbot-img.png"
                width={1199}
                height={1312}
                alt=""
                className="w-60 h-70"
              />
            </div>
          </div>
          <div className="basis-[30%] h-80 bg-white shadow-sm border border-ai rounded-xl py-5 px-5">
            <h4 className="font-bold text-lg mb-3">Quick Actions</h4>
            <div className="flex flex-col">
              <Link
                href="/chatbot"
                className="flex justify-between items-center text-main font-bold bg-fourth/30 px-3 py-2 mb-2 rounded-lg "
              >
                <div>
                  <IoChatboxEllipsesOutline className="inline mr-2" />
                  Chat with Pilot AI
                </div>
              <IoIosArrowForward />
              </Link>
              <Link
                href="/doctors"
                className="flex justify-between items-center text-main font-bold bg-fourth/30 px-3 py-2 mb-2 rounded-lg "
              >
                <div>
                  <FaUserDoctor className="inline mr-2" />
                  Find a Doctor
                </div>
                <IoIosArrowForward />
              </Link>
            </div>
            <h4 className="font-bold text-lg mb-3">Recent Alerts</h4>
            <div className="bg-fourth/30 h-25 rounded-lg flex-center px-3 text-center">
              {loading ? (
                <span className="text-[13px] text-gray-500">Loading...</span>
              ) : topAlert ? (
                <span className="text-[13px] font-semibold">
                  {topAlert.classification}
                </span>
              ) : (
                <span className="text-[13px] text-gray-500">No alerts today</span>
              )}
            </div>
          </div>
        </div>
        <div className="min-h-80 bg-white shadow-sm border border-ai rounded-xl px-10 py-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-bold text-lg">Recommended Doctors For You</h4>
            <Link href="/doctors" className="text-main font-bold">
              view all
            </Link>
          </div>
          {loading ? (
            <div className="h-20 rounded-xl bg-fourth/10 animate-pulse" />
          ) : careTeam.length === 0 ? (
            <p className="text-gray-500 text-[14px]">
              No providers are on your care team yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {careTeam.slice(0, 3).map((doctor) => (
                <div
                  key={doctor.provider_id}
                  className="flex items-center gap-3 border border-ai rounded-xl p-3"
                >
                  <div className="w-12 h-12 rounded-full bg-ai/30 flex-center text-secondary font-bold shrink-0">
                    {doctor.first_name?.[0]}
                    {doctor.last_name?.[0]}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[14px] truncate">
                      Dr. {doctor.first_name} {doctor.last_name}
                    </p>
                    <p className="text-secondary text-[13px] truncate">
                      {doctor.specialty}
                    </p>
                    {doctor.clinic_name && (
                      <p className="text-gray-500 text-[12px] truncate">
                        {doctor.clinic_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="flex-center gap-4 font-semibold text-[14px]">
        <MdLockOutline /> Your date is private and secure
      </p>
    </div>
  );
};

export default Dashboard;
