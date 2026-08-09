"use client";

import React from "react";
import { motion } from "framer-motion";
import { useState } from "react";
import accordion from "../faqs";
import { LuPlus } from "react-icons/lu";
import { LuMinus } from "react-icons/lu";
const Accordion = () => {
  const [clicked, setClicked] = useState<number | null>(null);

  const toggle = (i: number) => {
    if (clicked === i) {
      return setClicked(null);
    }
    setClicked(i);
  };

  return (
    <section className="flex-center mx-auto h-180 py-12 bg-[linear-gradient(180deg,rgba(0,0,0,0)_60%,rgba(205,231,127,0.5)_100%)]">
      <div className="flex justify-center w-[80%]">
        <h2 className="leading-none font-medium basis-2/5">
          Why{" "}
          <span className="text bg-linear-to-r from-[#BFD67C] via-[#58D78A] to-[#20a4b3] bg-clip-text text-transparent">
            VitalPilot
          </span>{" "}
          is <br /> Your Best Choice <br />
          for Everyday <br />
          Health Insights
        </h2>

        <div className="flex flex-col basis-3/5">
          {accordion.map((data, i) => (
            <div key={data.question} className="border-b border-gray-300">
              <div
                className="flex justify-between items-center cursor-pointer transition duration-300 w-full"
                onClick={() => toggle(i)}
              >
                <h3 className="font-semibold leading-tight basis-2/3 text-[22px] py-2">
                  {data.question}
                </h3>
                <span className="text-[30px] font-bold">
                  {clicked === i ? <LuMinus /> : <LuPlus />}
                </span>
              </div>

              <p
                className={
                  clicked === i
                    ? "font-semibold text-justify mb-3 overflow-hidden opacity-100 transition duration-300 ease max-h-full w-[85%]"
                    : "font-semibold text-justify mb-3 overflow-hidden opacity-0 ease max-h-0 w-[85%]"
                }
              >
                {data.answer}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Accordion;
