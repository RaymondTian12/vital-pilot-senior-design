"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaArrowUp } from "react-icons/fa6";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { VscLayoutSidebarRightDock } from "react-icons/vsc";
import { VscLayoutSidebarLeftDock } from "react-icons/vsc";

// import { IoMdAdd } from "react-icons/io";
import Image from "next/image";

const Chatbot = () => {
  const [clicked, setClicked] = useState<boolean>(false);

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;

    textarea.style.height = "auto";

    const maxHeight = 130;

    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;

    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  return (
    <div className="flex  h-screen">
      <div className="w-[200]">
        <div className="">
          <IoChatboxEllipsesOutline className="" /> New chat
        </div>
      </div>
      <div className="bg-amber-200 flex flex-1 items-center justify-between flex-col h-full ">
        {/* <button className="absolute top-10 -translate-y-1/2">
          <VscLayoutSidebarRightDock className="" />
        </button> */}
        <Link
          href="/"
          className="drop-shadow-lg mt-10 "
        >
          <Image
            src="/assets/logo_green1.png"
            alt="Vitalpilot"
            width={50}
            height={50}
          />
        </Link>
        <div 
        className=" drop-shadow-lg"
        >
          <h2 className="font-medium font-[georgia]">Hello, Username</h2>
          <h4 className="font-semibold text-gray-600">
            I'm Pilot AI How can I help you today with your health today?
          </h4>
          <div className="flex-center gap-x-4 mt-5">
            <button className="bg-fourth text-title rounded-full py-2 px-5 font-semibold cursor-pointer hover:bg-main transition duration-300">
              Check Symptoms
            </button>
            <button className="bg-fourth text-title rounded-full py-2 px-5 font-semibold cursor-pointer hover:bg-main transition duration-300">
              Explain My Vitals
            </button>
            <button className="bg-fourth text-title rounded-full py-2 px-5 font-semibold cursor-pointer hover:bg-main transition duration-300">
              Find a Specialist
            </button>
            <button className="bg-fourth text-title rounded-full py-2 px-5 font-semibold cursor-pointer hover:bg-main transition duration-300">
              Lifestyle Recommendations
            </button>
          </div>
        </div>
        {/* background glow */}
        <div
          className="
          absolute
          bottom-5
          left-1/2
          h-10
          w-full
          -translate-x-1/2
          bg-main
          blur-[100px]
        "
        />

        {/* CHAT INPUT */}
        <div
          className="
          mb-10
          w-[800px]
        "
        >
          <div
            className="
            flex
            min-h-[70px]
            w-full
            flex-col
            rounded-[28px]
            border
            border-gray-200
            bg-white
            px-4
            py-3
            shadow-sm
            transition-all
            focus-within:ring-2
            focus-within:ring-main
          "
          >
            {/* TEXTAREA */}
            <textarea
              rows={1}
              onInput={handleInput}
              placeholder="Describe your symptom(s) or ask any health questions..."
              className="
              min-h-[32px]
              max-h-[130px]
              w-full
              resize-none
              overflow-y-hidden
              bg-transparent
              px-2
              py-2
              text-[16px]
              leading-6
              outline-none
              placeholder:text-gray-400

              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
            "
            />

            {/* BOTTOM CONTROLS */}
            <div className="mt-1 flex items-center justify-between">
              {/* LEFT */}
              {/* <button
              type="button"
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                text-[25px]
                transition
                hover:bg-gray-100
              "
            >
              <IoMdAdd />
            </button> */}

              {/* RIGHT */}
              <div className="flex items-center gap-2 w-full justify-end">
                <button
                  type="button"
                  className="
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-full
                  cursor-pointer
                  bg-main
                  text-white
                  transition
                  hover:bg-secondary
                "
                >
                  <FaArrowUp />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
