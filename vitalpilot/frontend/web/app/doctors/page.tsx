import React from "react";
import Navbar from "../components/Navbar";
import Image from "next/image";
import { MdOutlineVerifiedUser } from "react-icons/md";
import { LuCalendarDays } from "react-icons/lu";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";

const page = () => {
  return (
    <div>
      <Navbar />
      <div className="relative max-w-[1500px] w-[90%] mx-auto h-[550px] rounded-3xl mt-5 drop-shadow-lg">
        <div
        className="w-full h-full absolute rounded-3xl top-0
      bg-[linear-gradient(90deg,rgba(255,255,255,.9)_0%,rgba(255,255,255,.6)_0%,rgba(0,0,0,0)_80%)]"
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
              <MdOutlineVerifiedUser className="text-[40px] text-main"/>Verified
              <br /> Doctors
            </div>
            <div className="w-fit h-[80px] px-5 rounded-2xl flex-center gap-2 text-[18px] font-bold drop-shadow-2xl bg-white/60 backdrop-blur-sm">
              <LuCalendarDays className="text-[40px] text-main"/>Easy
              <br /> Booking
            </div>
            <div className="w-fit h-[80px] px-5 rounded-2xl flex-center gap-2 text-[18px] font-bold drop-shadow-2xl bg-white/60 backdrop-blur-sm">
              <IoChatbubbleEllipsesOutline className="text-[40px] text-main"/>hassle-free
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
