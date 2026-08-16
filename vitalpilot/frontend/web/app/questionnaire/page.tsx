"use client"

import React, { useState } from "react";
import Image from "next/image";

const Questionnaire = () => {

    const [step, setStep] = useState(1)
  return (
    <div className="flex flex-col items-center h-screen ">
      <div className="flex-center gap-5 mt-7 border-b border-ai w-full pb-5">
        <div className="flex gap-2">
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
          <div className="w-[50] h-[7] rounded-2xl bg-ai"></div>
        </div>
        <a href="" className="drop-shadow-lg ">
          <Image
            src="/assets/logo_green1.png"
            alt="Vitalpilot"
            width={30}
            height={30}
          />
        </a>
      </div>
      <div className="min-w-[700] min-h-[650] shadow-[5px_5px_10px,-5px_-5px_10px] shadow-ai/50 rounded-2xl mt-7">
        {
          step === 1 && (
            <div className="flex flex-col">
              <h3>What is your first and last name?</h3>

              <span>First name</span>
              <input type="text" name="" id=""  className="wi"/>

              <span>Last name</span>
              <input type="text" name="" id="" />
            </div>
          ) 
        }
      </div>
    </div>
  );
};

export default Questionnaire;
