import React from "react";
import { HiCursorClick } from "react-icons/hi";
import Image from "next/image";

const DescriptionDoctor = () => {
  return (
    <div className="flex h-[600]">
      <div className="relative basis-3/5">
        <Image
          src="/assets/phone_scrolling.png"
          alt=""
          width={1489}
          height={1056}
          className="absolute left-20 top-20  w-120 h-100 rounded-2xl shadow-[1px_1px_10px] shadow-black ml-15"
        />
        <div className="absolute left-20 top-50 w-60 h-90 bg-ai rounded-2xl z-20 shadow-[-4px_10px_20px] shadow-fourth">
          <Image
            src="/assets/doctor_profile.png"
            alt=""
            width={1086}
            height={1448}
            className="w-full h-75 rounded-t-2xl "
          />
          <p className="flex-center font-semibold mt-4 text-[16px] drop-shadow-2xl gap-x-2">
            Find a doctor in one-click{" "}
            <HiCursorClick className=" text-[20px]" />
          </p>
        </div>
        <Image
          src="/assets/doctor_description.png"
          alt=""
          width={1024}
          height={1536}
          className="absolute left-1 top-10 w-[400] -z-10"
        />
      </div>

      <div className="basis-2/5 flex flex-col justify-center gap-y-5">
        <h3 className="text-[20px] w-fit py-1 px-5 bg-fourth font-semibold rounded-xl">
          Try to find a doctor?
        </h3>
        <h2 className="text- font-semibold leading-none">
          Find the right doctor for your care
        </h2>
        <p className="font-medium leading-5 text-gray-500 text-justify">
          VitalPilot helps you find providers and prepare for better
          conversations about your care.
        </p>
        <ul className="flex flex-col  text-[18px] font-semibold leading-6">
          <li className="drop-shadow-xl flex gap-x-2 items-center">
            <Image
              src="/assets/bulletpoint_doctor_1.png"
              alt="bulletpoint"
              width={1200}
              height={1200}
              className="w-17.5 h-12.5"
            />
            Find providers that fit your needs
          </li>
          <li className="drop-shadow-xl flex gap-x-2 items-center">
            <Image
              src="/assets/bulletpoint_doctor_2.png"
              alt="bulletpoint"
              width={1200}
              height={1200}
              className="w-17.5 h-17.5"
            />
            Connect with a doctor when needed
          </li>
          <li className="drop-shadow-xl flex gap-x-2 items-center">
            <Image
              src="/assets/bulletpoint_doctor_3.png"
              alt="bulletpoint"
              width={1200}
              height={1200}
              className="w-17.5 h-15"
            />
            Share your health trends and symptoms
          </li>
        </ul>
        <a
          className="font-semibold bg-amber-300 w-fit py-2 px-5 rounded-lg drop-shadow-md 
            hover:text-text hover:bg-amber-400 transition-all duration-300"
          href=""
        >
          Explore available doctors
        </a>
      </div>
    </div>
  );
};

export default DescriptionDoctor;
