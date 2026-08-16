"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState, useEffect } from "react";
const Hero = () => {
  const messages: string[] = [
    "Useful summaries you can share with your healthcare provider",
    "Track your daily health metrics, spot important changes",
    "Get AI-powered insights that help you stay informed",
  ];

  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % messages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <section className="relative h-[700]">
      <Image
        src="/assets/hero_pic.png"
        alt="Image showing senior citizens using the app"
        width={1678}
        height={937}
        className="w-full h-full"
      />

      <div className="hero-content flex-center flex-col w-full absolute z-20 -bottom-5 left-1/2 -translate-1/2">
        <h1 className="text-white drop-shadow-lg">
          Stay connected to your health.
        </h1>

        <AnimatePresence mode="wait">
          <motion.h3
            className="h-10 flex items-center justify-center text-white my-1"
            key={currentMessage}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: -7 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            {messages[currentMessage]}
          </motion.h3>
        </AnimatePresence>

        <div className="btn flex-center gap-5 drop-shadow-lg ">
          <a
            className="rounded-full px-6 py-2 text-[18px] text-white bg-main border-2 border-main hover:bg-secondary hover:border-secondary"
            href=""
          >
            Get Started
          </a>
          <a
            className=" rounded-full px-6 py-2 text-[18px] text-white bg-transparent border-2 border-white
              hover:bg-white hover:text-main "
            href=""
          >
            Learn More
          </a>
        </div>
      </div>

      <div
        className="w-full h-full absolute  top-0
      bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.2)_50%,rgba(0,0,0,0.7)_90%)]"
      ></div>
    </section>
  );
};

export default Hero;
