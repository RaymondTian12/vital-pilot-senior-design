import React from "react";
import Image from "next/image";
import { PiSignInBold } from "react-icons/pi";

const Navbar = () => {
  return (
    <div
      className="bg-white fixed w-[80%] mx-auto mt-5 left-1/2 -translate-x-1/2 
                  rounded-2xl h-17 flex justify-around items-center z-40 shadow-xl"
    >
      <a href="" className="drop-shadow-lg">
        <Image
          src="/assets/logo_hero.png"
          alt="Vitalpilot"
          width={160}
          height={150}
        />
      </a>
      <ul className="gap-6 flex items-center">
        <li>
          <a
            className="bg-ai px-3 py-1 text-[16px] rounded-full font-bold drop-shadow-md
            font-quicksand flex-center gap-1 hover:text-black hover:bg-[#dce6fd]"
            href=""
          >
            <Image
              src="/assets/ai_black.png"
              width={15}
              height={15}
              alt="ai-logo"
            />
            PILOT AI
          </a>
        </li>
        <li>
          <a href="">
            Doctors
          </a>
        </li>
        <li>
          <a href="">
            Dashboard
          </a>
        </li>
        <li>
          <a href="">
            Download App
          </a>
        </li>
      </ul>
      <div className="w-70 h-full flex-center gap-3">
        <button>
          <a className="flex-center gap-1 font-semibold" href="">
            <PiSignInBold />
            Sign in
          </a>
        </button>
        <button>
          <a
            className="text-white px-5 py-2 bg-main rounded-[10px] hover:bg-secondary font-semibold"
            href=""
          >
            Get Started
          </a>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
