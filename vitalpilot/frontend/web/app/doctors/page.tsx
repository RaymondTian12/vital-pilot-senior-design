import React from "react";
import Navbar from "../components/Navbar";
import Image from "next/image";
import { MdOutlineVerifiedUser } from "react-icons/md";
import { LuCalendarDays } from "react-icons/lu";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";

const page = () => {
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
      <div className="flex bg-ai/30 h-200 w-[80%] mx-auto mt-10 gap-5 p-5">
        <aside className="flex flex-col basis-2/7 border border-gray bg-white p-4 font-medium rounded-lg gap-5">
                <div className="flex justify-between mb-5">Filter <button className="cursor-pointer">Reset</button></div>
                
                <div className="font-semibold">
                  <h4 className="mb-3">Provider gender</h4>
                  <div className="flex gap-5">
                    <button className="border border-gray rounded-full py-1 px-3 text-[14px]">Any</button>
                    <button className="border border-gray rounded-full py-1 px-3 text-[14px]">Male</button>
                    <button className="border border-gray rounded-full py-1 px-3 text-[14px]">Female</button>
                  </div>
                </div>
                <div className="font-semibold">
                    <h4 className="mb-3">Provider specialty</h4>
                    <div className="flex gap-2 mb-3">
                        <input type="checkbox" name="Bariatrician" id="specialty" className="w-5 accent-main"/>
                        <label htmlFor="Bariatrician">Bariatrician</label>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <input type="checkbox" name="Cardiologist" id="specialty" className="w-5 accent-main"/>
                        <label htmlFor="Cardiologist">Cardiologist</label>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <input type="checkbox" name="Endocrinologist" id="specialty" className="w-5 accent-main"/>
                        <label htmlFor="Endocrinologist">Endocrinologist</label>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <input type="checkbox" name="Nephrologist" id="specialty" className="w-5 accent-main"/>
                        <label htmlFor="Nephrologist">Nephrologist</label>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <input type="checkbox" name="Sleep" id="specialty" className="w-5 accent-main"/>
                        <label htmlFor="Sleep">Sleep Medicine Physician</label>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <input type="checkbox" name="Sport" id="specialty" className="w-5 accent-main"/>
                        <label htmlFor="Sport">Sport Medicine Physician</label>
                    </div>
                    <div className="flex gap-2 mb-3">
                        <input type="checkbox" name="Pulmonologist" id="specialty" className="w-5 accent-main"/>
                        <label htmlFor="Pulmonologist">Pulmonologist</label>
                    </div>
            </div>
        </aside>
        <div className="basis-5/7 flex flex-col ">
          <h3 className="text-secondary font-bold mb-5">Best online doctors and providers, available now</h3>
          <div className="self-end font-semibold">
            <label>Sort by</label>
            <select name="" id="" className="ml-3 bg-white py-2 px-3 drop-shadow-sm">
                <option value="" className="">Most relevant</option>
                <option value="" className="">Highest rated</option>
            </select>

          </div>
        </div>
      </div>
    </div>
  );
};

export default page;
