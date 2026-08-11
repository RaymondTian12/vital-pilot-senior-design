"use client";
import { motion } from "framer-motion";
import React from "react";
import { HiCursorClick } from "react-icons/hi";
import { GoGraph } from "react-icons/go";
import { LuUpload } from "react-icons/lu";
import { IoChatboxEllipses } from "react-icons/io5";

import Image from "next/image";

const Description = () => {
  return (
    <section className="w-[80%] overflow-y-hidden mx-auto my-10">
      <div className="flex-center flex-col mb-10">
        <h4 className="font-quicksand font-bold text-main mb-3">
          Meet <span className="font-quicksand">PILOT AI</span>
        </h4>
        <h1 className="leading-none text-center mb-5 drop-shadow-2xl">
          Smarter insights for your
          <br />
          everyday health
        </h1>
        <p className="text-center font-semibold text-gray-500">
          Understand your health, get symptom guidance, and
          <br /> prepare for better conversations with your doctor.
        </p>
        <div className="flex-center gap-4 my-10">
          <div className="flex flex-col w-[340px] h-[420px] rounded-2xl overflow-hidden shadow-xl">
            <div className="bg-[#CAE9F3] flex-center w-full h-[60%]">
              <Image
                src="/assets/ai_description_1.png"
                alt=""
                width={1536}
                height={1024}
                className="w-full drop-shadow-2xl"
              />
            </div>
            <div className="flex-center text-center flex-col py-5 px-3">
              <div className="w-10 h-10 bg-[#CAE9F3] rounded-full flex-center text-main">
                <GoGraph className="w-5 h-5 font-bold" />
              </div>
              <h4 className="font-bold text-[18px] text-secondary mb-2">
                Understand your health
              </h4>
              <p className="font-semibold px-3">
                Pilot AI reviews your health data and turns it into
                easy-to-understand
              </p>
            </div>
          </div>

          <div className="flex flex-col w-[340px] h-[420px] rounded-2xl overflow-hidden shadow-xl">
            <div className="w-full h-[60%]">
              <Image
                src="/assets/w.png"
                alt=""
                width={1400}
                height={1100}
                className="w-full h-full"
              />
            </div>
            <div className="flex-center text-center flex-col py-5 px-3">
              <div className="w-10 h-10 bg-[#CDE77F] rounded-full flex-center text-main">
                <IoChatboxEllipses className="w-5 h-5" />
              </div>

              <h4 className="font-bold text-[18px] text-secondary mb-2">
                Get symptoms insights
              </h4>
              <p className="font-semibold px-3">
                Describe your symptoms and let Pilot AI highlight what may need
                attention
              </p>
            </div>
          </div>

          <div className="flex flex-col w-[340px] h-[420px] rounded-2xl overflow-hidden shadow-xl">
            <div className="w-full h-[60%]">
              <Image
                src="/assets/ai_description_33.png"
                alt=""
                width={1448}
                height={1086}
                className="w-full h-full"
              />
            </div>
            <div className="flex-center text-center flex-col py-5 px-3">
              <div className="w-10 h-10 bg-[#f4e285] rounded-full flex-center text-main">
                <LuUpload className="w-5 h-5" />
              </div>

              <h4 className="font-bold text-[18px] text-secondary mb-2">
                Share with your doctor
              </h4>
              <p className="font-semibold px-3">
                Pilot AI creates clear summaries you can review and share with
                your doctor
              </p>
            </div>
          </div>
        </div>
        <div className="w-fit rounded-full bg-[linear-gradient(90deg,#C0D769_0%,#C7C4BE_50%,#38EE91_100%)] p-[1.5px] drop-shadow-md">
          <a
            href=""
            className="flex-center gap-x-1 bg-ai py-2 px-10 rounded-full"
          >
            <Image
              src="/assets/ai_green.png"
              alt=""
              width={240}
              height={240}
              className="w-5 h-5"
            />

            <p className="font-quicksand font-bold text-[20px]">PILOT AI</p>
          </a>
        </div>
      </div>

      <div></div>

      <div className="flex h-150">
        <div className="basis-3/5">
          <Image
            src="/assets/phone_scrolling.png"
            alt=""
            width={1489}
            height={1056}
            className="translate-x-10 w-130 h-100 rounded-2xl shadow-[1px_1px_10px] shadow-black ml-15"
          />
          <div className="-translate-y-70 translate-x-10 w-60 h-90 bg-ai rounded-2xl z-20 shadow-[-4px_10px_20px] shadow-fourth">
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
        </div>

        <div className="basis-2/5 flex flex-col justify-center gap-y-5">
          <h3 className="text-[20px] w-fit py-1 px-5 bg-fourth font-semibold rounded-xl">
            Try to find a doctor?
          </h3>
          <h2 className="text-[30px] font-semibold leading-none">
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
                className="w-[70px] h-[50px]"
              />
              Find providers that fit your needs
            </li>
            <li className="drop-shadow-xl flex gap-x-2 items-center">
              <Image
                src="/assets/bulletpoint_doctor_2.png"
                alt="bulletpoint"
                width={1200}
                height={1200}
                className="w-[70px] h-[70px]"
              />
              Connect with a doctor when needed
            </li>
            <li className="drop-shadow-xl flex gap-x-2 items-center">
              <Image
                src="/assets/bulletpoint_doctor_3.png"
                alt="bulletpoint"
                width={1200}
                height={1200}
                className="w-[70px] h-[60px]"
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
    </section>
  );
};

export default Description;
