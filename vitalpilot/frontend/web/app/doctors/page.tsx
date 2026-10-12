"use client";

import React, { useState } from "react";
import Navbar from "../components/Navbar";
import DoctorCard from "../components/doctorCard";
import Image from "next/image";
import { MdOutlineVerifiedUser } from "react-icons/md";
import { LuCalendarDays } from "react-icons/lu";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";

import { api, type Doctor } from "../services/api";

const SPECIALTY_OPTIONS: { label: string; taxonomy: string }[] = [
  { label: "Bariatrician", taxonomy: "Obesity Medicine" },
  { label: "Cardiologist", taxonomy: "Cardiovascular Disease" },
  {
    label: "Endocrinologist",
    taxonomy: "Endocrinology, Diabetes & Metabolism",
  },
  { label: "Nephrologist", taxonomy: "Nephrology" },
  { label: "Sleep Medicine Physician", taxonomy: "Sleep Medicine" },
  { label: "Sport Medicine Physician", taxonomy: "Sports Medicine" },
  { label: "Pulmonologist", taxonomy: "Pulmonary Disease" },
];

const Page = () => {
  const [gender, setGender] = useState<"Any" | "Male" | "Female">("Any");
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleSpecialty = (taxonomy: string) => {
    setSelectedSpecialties((prev) =>
      prev.includes(taxonomy)
        ? prev.filter((t) => t !== taxonomy)
        : [...prev, taxonomy],
    );
  };

  const resetFilters = () => {
    setGender("Any");
    setSelectedSpecialties([]);
    setCity("");
    setState("");
    setDoctors([]);
    setHasSearched(false);
    setError(null);
  };

  const handleSearch = async () => {
    if (selectedSpecialties.length === 0 && !city && !state) {
      setError("Select a specialty or enter a location to search.");
      return;
    }

    setError(null);
    setIsSearching(true);
    setHasSearched(true);

    try {
      const genderParam = gender === "Any" ? undefined : gender[0]; // "M" | "F"
      const specialtiesToQuery =
        selectedSpecialties.length > 0 ? selectedSpecialties : [undefined];

      const results = await Promise.all(
        specialtiesToQuery.map((specialty) =>
          api.searchDoctors({
            specialty,
            city: city || undefined,
            state: state || undefined,
            gender: genderParam,
          }),
        ),
      );

      const merged = new Map<string, Doctor>();
      for (const list of results) {
        for (const doctor of list) {
          merged.set(doctor.npi, doctor);
        }
      }
      setDoctors(Array.from(merged.values()));
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to search for doctors.",
      );
      setDoctors([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="">
      <Navbar />
      <div className="relative max-w-[1500px] w-[90%] mx-auto h-[550px] rounded-3xl drop-shadow-lg">
        <div
          className="w-full h-full absolute rounded-3xl top-0
      bg-[linear-gradient(90deg,rgba(255,255,255)_0%,rgba(255,255,255,.7)_40%,rgba(0,0,0,0)_80%)]"
        ></div>
        <Image
          src="/assets/doctor_cover.png"
          alt=""
          width={1896}
          height={829}
          className="w-full h-full rounded-3xl z-10"
        />

        <div className="absolute top-25 left-40 z-10">
          <h1 className="text-[50px] text-title font-bold mt-5 leading-12 mb-5">
            Find the right doctor <br />
            for your health
          </h1>
          <p className="text-[20px] font-semibold mb-10">
            Search and connect with trusted healthcare <br />
            providers who fit your needs and <br />
            preferences
          </p>
          <div className="flex items-center gap-5 mt-5">
            <div className="w-fit h-[80px] px-5 rounded-2xl flex-center gap-2 text-[18px] font-bold drop-shadow-2xl bg-white/60 backdrop-blur-sm">
              <MdOutlineVerifiedUser className="text-[40px] text-main" />
              Verified
              <br /> Doctors
            </div>
            <div className="w-fit h-[80px] px-5 rounded-2xl flex-center gap-2 text-[18px] font-bold drop-shadow-2xl bg-white/60 backdrop-blur-sm">
              <LuCalendarDays className="text-[40px] text-main" />
              Easy
              <br /> Booking
            </div>
            <div className="w-fit h-[80px] px-5 rounded-2xl flex-center gap-2 text-[18px] font-bold drop-shadow-2xl bg-white/60 backdrop-blur-sm">
              <IoChatbubbleEllipsesOutline className="text-[40px] text-main" />
              hassle-free
            </div>
          </div>
        </div>
      </div>
      <div className="flex bg-ai/30 h-200 w-[90%] max-w-[1500px] mx-auto mt-10 gap-5 p-5">
        <aside className="flex flex-col basis-2/7 border border-gray bg-white p-4 font-medium rounded-lg gap-5">
          <div className="flex justify-between mb-5">
            Filter{" "}
            <button className="cursor-pointer" onClick={resetFilters}>
              Reset
            </button>
          </div>

          <div className="font-semibold">
            <h4 className="mb-3">Location</h4>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                placeholder="City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-[60%] border border-gray rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-main"
              />
              <input
                type="text"
                placeholder="State (e.g. TX)"
                value={state}
                onChange={(e) => setState(e.target.value.toUpperCase())}
                maxLength={2}
                className="w-[40%] border border-gray rounded-lg px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-main"
              />
            </div>
          </div>

          <div className="font-semibold">
            <h4 className="mb-3">Provider gender</h4>
            <div className="flex gap-5">
              {(["Any", "Male", "Female"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setGender(option)}
                  className={`border border-gray rounded-full py-1 px-3 text-[14px] cursor-pointer ${
                    gender === option ? "bg-main text-white border-main" : ""
                  }`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
          <div className="font-semibold">
            <h4 className="mb-3">Provider specialty</h4>
            {SPECIALTY_OPTIONS.map(({ label, taxonomy }) => (
              <div className="flex gap-2 mb-3" key={taxonomy}>
                <input
                  type="checkbox"
                  name={label}
                  id={label}
                  className="w-5 accent-main"
                  checked={selectedSpecialties.includes(taxonomy)}
                  onChange={() => toggleSpecialty(taxonomy)}
                />
                <label htmlFor={label}>{label}</label>
              </div>
            ))}
          </div>

          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="w-full bg-main text-white rounded-lg py-2 font-semibold cursor-pointer disabled:opacity-60"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </aside>
        <div className="basis-5/7 flex flex-col overflow-y-auto">
          <h3 className="text-secondary font-bold mb-5">
            Best online doctors and providers, available now
          </h3>
          <div className="self-end font-semibold mb-5">
            <label>Sort by</label>
            <select className="ml-3 bg-white py-2 px-3 drop-shadow-sm">
              <option value="relevant">Most relevant</option>
            </select>
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}

          {!hasSearched && !error && (
            <p className="text-gray-500">
              Select a specialty or enter a location, then click Search to find
              real, verified providers from the CMS NPI Registry.
            </p>
          )}

          {hasSearched && !isSearching && doctors.length === 0 && !error && (
            <p className="text-gray-500">
              No providers found matching those filters. Try broadening your
              search.
            </p>
          )}

          {doctors.map((doctor) => (
            <DoctorCard key={doctor.npi} doctor={doctor} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
