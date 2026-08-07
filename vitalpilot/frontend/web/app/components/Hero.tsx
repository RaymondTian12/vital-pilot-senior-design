"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const Hero = () => {
  const messages: string[] = [
    "Useful summaries you can share with your healthcare provider",
    "Track your daily health metrics, spot important changes",
    "Get AI-powered insights that help you stay informed",
  ];

  return (
    <section className="relative w-screen h-[700]">
      <Image
        src="/assets/hero_pic.png"
        alt="Image showing senior citizens using the app"
        width={1678}
        height={937}
        className="w-screen h-full"
      />

      <div className="hero-content flex-center flex-col w-full absolute z-20 bottom-0 left-1/2 -translate-1/2 ">
        <h1 className="text-white drop-shadow-lg">
          Stay connected to your health.
        </h1>
        {/* {messages.map((message: string, i: number) => (
          <motion.h2
            className="mb-4 drop-shadow-lg text-white whitespace-nowrap absolute"
            key={i}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: [0, 1, 1, 0], y: [30, 0, 0, -30] }}
            transition={{ duration: 4, delay: i * 4, repeat: Infinity, repeatDelay: 6}}
          >
            {message}
          </motion.h2>
        ))} */}
        <div className="relative h-[60px] w-full flex justify-center items-center">
          {messages.map((message, i) => (
            <motion.h2
              key={i}
              className="absolute whitespace-nowrap text-white drop-shadow-lg"
              initial={{ opacity: 0 }}
              animate={{
                opacity: [0, 0, 1, 1, 0, 0],
                y: [20, 20, 0, 0, -20, -20],
              }}
              transition={{
                duration: 9,
                delay: i * 3,
                repeat: Infinity,
                times: [0, 0.05, 0.1, 0.28, 0.33, 1],
                ease: "easeInOut",
              }}
            >
              {message}
            </motion.h2>
          ))}
        </div>
        <div className="btn flex-center gap-5 drop-shadow-lg">
          <a
            className="rounded-full px-6 py-2 text-white bg-main border-2 border-main hover:bg-secondary hover:border-secondary"
            href=""
          >
            Get Started
          </a>
          <a
            className=" rounded-full px-6 py-2 text-white bg-transparent border-2 border-white
              hover:bg-white hover:text-main "
            href=""
          >
            Learn More
          </a>
        </div>
      </div>

      <div
        className="w-full h-full absolute  top-0
      bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.7)_90%)]"
      ></div>
    </section>
  );
};

export default Hero;
