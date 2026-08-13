"use client";

import React from "react";
import { FaArrowUp } from "react-icons/fa6";
import { FiMic } from "react-icons/fi";
import { IoMdAdd } from "react-icons/io";

const Chatbot = () => {
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;

    textarea.style.height = "auto";

    const maxHeight = 130;

    textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;

    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  };

  return (
    <div className="relative h-screen">
      {/* background glow */}
      <div
        className="
          absolute
          bottom-5
          left-1/2
          h-[100px]
          w-full
          -translate-x-1/2
          bg-main
          blur-[200px]
        "
      />

      {/* CHAT INPUT */}
      <div
        className="
          absolute
          bottom-10
          left-1/2
          w-[800px]
          -translate-x-1/2
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
            placeholder="Describe your symptom or ask any health questions..."
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
  );
};

export default Chatbot;
