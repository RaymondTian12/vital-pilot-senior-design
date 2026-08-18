"use client";

import React, { useState } from "react";
import Link from "next/link";
import { FaArrowUp } from "react-icons/fa6";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { RiChatNewLine } from "react-icons/ri";

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
    <div className="flex h-screen">
      <div
        className={`flex flex-col justify-between border-r border-r-ai  ${clicked ? "w-[70px] px-3 py-5" : "w-[250px] px-5"}`}
      >
        <div className="">
          <div className="flex items-center justify-between mb-20">
            <Link href="/">
              {!clicked && (
                <Image
                  src="/assets/logo_hero.png"
                  alt="Vitalpilot"
                  width={120}
                  height={120}
                  className="-translate-x-5"
                />
              )}
            </Link>{" "}
            <button onClick={() => setClicked((prev) => !prev)}>
              {clicked ? (
                <VscLayoutSidebarRightDock className="text-[20px] text-gray-400 cursor-pointer transition duration-300 -translate-x-3" />
              ) : (
                <VscLayoutSidebarLeftDock className="text-[20px] text-gray-400 cursor-pointer transition duration-300" />
              )}
            </button>
          </div>
          <button className="flex gap-x-2 items-center font-semibold mb-3 hover:bg-fourth rounded-lg py-1 px-3 w-full cursor-pointer">
            <RiChatNewLine className="" /> {!clicked && <span>New chat</span>}
          </button>
          <button className="flex gap-x-2 pl-3 items-center font-semibold">
            <IoChatboxEllipsesOutline className="" />{" "}
            {!clicked && <span>Recent chats</span>}
          </button>
        </div>
        <div
          className={`${clicked ? "invisible" : "mb-15 w-full mx-auto flex justify-center flex-col p-5 rounded-2xl bg-fourth/50"} `}
        >
          <Image
            src="/assets/secure_logo.png"
            alt=""
            width={1312}
            height={1199}
            className="w-[80] h-[80] self-center"
          />
          <h4 className="font-bold mb-2 text-center">Your data is safe</h4>
          <p className="font-semibold text-[14px]">
            We use end-to-end encryption to keep your health data private and
            secure
          </p>
        </div>
      </div>
      <div className="relative flex flex-1 items-center justify-between flex-col h-full ">
        {/* background glow */}
        <div
          className="
          absolute
          bottom-5
          left-1/2
          h-10
          w-[95%]
          -translate-x-1/2
          bg-main
          blur-[100px]
          -z-10
        "
        />
        <Link href="/" className="drop-shadow-lg mt-10 ">
          <Image
            src="/assets/logo_green1.png"
            alt="Vitalpilot"
            width={50}
            height={50}
          />
        </Link>
        <div className=" drop-shadow-lg">
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
