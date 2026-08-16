import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const DescriptionDashboard = () => {
  return (
    <div className="flex-center flex-col mb-15">
      <h1 className="leading-none text-center mb-7">
        Everything about your health,
        <br />
        <span className="text-main">connected</span> in one place.
      </h1>
      <h4 className="bg-third/60 font-bold py-2 px-10 rounded-full w-fit text-center drop-shadow-[2px_2px_20px_rgba(0,0,0,0.3)] mb-10">
        VitalPilot brings together your daily activity, vital signs, and AI
        insight
      </h4>
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{
          amount: 0.5,
          once: false,
        }}
        className="flex-center flex-col relative w-full max-w-[1200px]"
      >
        <motion.div
          variants={{
            hidden: {
              x: 250,
              rotate: 0,
              opacity: 0,
              scale: 0.5,
            },
            visible: {
              x: 0,
              rotate: -15,
              opacity: 1,
              scale: 1,
            },
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute top-[100px] left-[80px] z-0"
        >
          <Image
            src="/assets/man_running.png"
            alt="man running"
            width={1536}
            height={1024}
            className="w-[200px] rounded-2xl"
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: {
              x: 250,
              opacity: 0,
              scale: 0.5,
            },
            visible: {
              x: 0,
              opacity: 1,
              scale: 1,
            },
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute top-[10px] left-[40px] z-0 bg-third/70 font-bold py-2 px-4 rounded-full"
        >
          Track your movement
        </motion.div>
        <div
          className="
            relative

            before:content-['']
            before:absolute
            before:left-1/2
            before:top-110
            before:h-[40px]
            before:-translate-x-1/2
            before:border-l
            before:border-dashed
            before:border-[#19B788]"
           
        ></div>
        <div
          className="
            relative

            before:content-['']
            before:absolute
            before:-left-50
            before:top-110
            before:w-[50px]
            before:border-t
            before:border-dashed
            before:border-[#19B788]
            before:origin-left
            before:rotate-[130deg]"
        ></div>

        <div
        className="
            relative

            before:content-['']
            before:absolute
            before:left-50
            before:top-120
            before:w-[50px]
            before:border-t
            before:border-dashed
            before:border-[#19B788]
            before:origin-right
            before:rotate-[50deg]
        "
        >
        </div>
        <Image
          src="/assets/macbook.png"
          alt="macbook"
          width={1536}
          height={1024}
          className="w-[700px] drop-shadow-[0_18px_20px_rgba(0,0,0,0.5)] mb-5"
        />

        <motion.div
          variants={{
            hidden: {
              x: -250,
              rotate: 0,
              opacity: 0,
              scale: 0.5,
            },
            visible: {
              x: 0,
              rotate: 15,
              opacity: 1,
              scale: 1,
            },
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute top-[100px] right-[80px] -z-10"
        >
          <Image
            src="/assets/watch.png"
            alt="Smart watch"
            width={200}
            height={260}
            className="rounded-2xl object-cover z-20"
          />
        </motion.div>
        <motion.div
          variants={{
            hidden: {
              x: -250,
              opacity: 0,
              scale: 0.5,
            },
            visible: {
              x: 0,
              opacity: 1,
              scale: 1,
            },
          }}
          transition={{
            duration: 0.8,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute top-[10px] right-[40px] z-0 bg-third/70 font-bold py-2 px-4 rounded-full"
        >
          Record your vitals
        </motion.div>

        <div className="flex-center gap-x-5 leading-normal text-[14px]">
          <div className="flex-center gap-x-2 py-4 pl-5 pr-10 rounded-2xl shadow-[0px_3px_20px] shadow-black/10">
            <div className="flex-center w-15 h-15 bg-fuchsia-200 rounded-2xl ">
              <Image
                src="/assets/blood_glucose_dashboard.png"
                alt="Blood Glucose"
                width={50}
                height={50}
                className="border-2"
              />
            </div>
            <div className="flex flex-col">
              <h4 className="font-bold text-[16px]">Blood Glucose</h4>
              <p>
                <span className="font-bold">108</span> mg/dl
              </p>
              <span className="text-main font-bold">Normal</span>
            </div>
          </div>
          <div className="flex-center gap-x-2 py-4 pl-5 pr-10 rounded-2xl shadow-[0px_3px_20px] shadow-black/10">
            <div className="flex-center  w-15 h-15 bg-red-200 rounded-2xl ">
              <Image
                src="/assets/hypertension_dashboard.png"
                alt="Blood Pressure"
                width={50}
                height={50}
                className="border-2 rounded-4xl"
              />
            </div>
            <div className="flex-center flex-col">
              <h4 className="font-bold text-[16px]">Blood Pressure</h4>
              <p>
                <span className="font-bold">120/80</span> mmHg/dl
              </p>
              <span className="text-main font-bold">Normal</span>
            </div>
          </div>
          <div className="flex-center gap-x-2 py-4 pl-5 pr-10 rounded-2xl shadow-[0px_3px_20px] shadow-black/10">
            <div className="flex-center  w-15 h-15 bg-blue-100 rounded-2xl ">
              <Image
                src="/assets/blood_oxygen_dashboard.png"
                alt="Blood Oxygen"
                width={50}
                height={50}
                className="border-2 rounded-4xl"
              />
            </div>
            <div className="flex-center flex-col">
              <h4 className="font-bold text-[16px]">Blood Oxygen</h4>
              <p>
                <span className="font-bold">98%</span>
              </p>
              <span className="text-main font-bold">Normal</span>
            </div>
          </div>
        </div>
        <div className="absolute left-1 w-[200] h-[250] rounded-full bg-main -z-100 blur-[150px]"></div>
        <div className="absolute right-1  w-[200] h-[250] rounded-full bg-third -z-100 blur-[100px]"></div>
      </motion.div>
    </div>
  );
};

export default DescriptionDashboard;
