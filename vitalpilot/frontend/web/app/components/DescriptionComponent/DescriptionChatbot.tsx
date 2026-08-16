import React from 'react'
import { GoGraph } from "react-icons/go";
import { LuUpload } from "react-icons/lu";
import { IoChatboxEllipses } from "react-icons/io5";
import Image from "next/image";
const DescriptionChatbot = () => {
  return (
      <div className="flex-center flex-col mb-10">
        <h4 className="font-quicksand font-bold text-main mb-3">
          Meet <span className="font-quicksand">PILOT AI</span>
        </h4>
        <h1 className="leading-none text-center mb-5 drop-shadow-2xl">
          Smarter insights for your
          <br />
          everyday <span className="text-main">health</span> 
        </h1>
        <p className="text-center font-semibold text-gray-500">
          Understand your health, get symptom guidance, and
          <br /> prepare for better conversations with your doctor.
        </p>
        <div className="flex-center gap-4 my-10">
          <div className="flex-center flex-col w-[360px] h-[420px] rounded-2xl  shadow-xl border-1 border-gray-100">
            <div className="flex-center w-[97%] h-[60%]">
              <Image
                src="/assets/ai_description_11.png"
                alt=""
                width={1536}
                height={1024}
                className="w-full h-full rounded-2xl mt-2"
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

          <div className="flex-center flex-col w-[360px] h-[420px] rounded-2xl  shadow-xl border-1 border-gray-100">
            <div className="w-[97%] h-[60%] flex-center">
              <Image
                src="/assets/w.png"
                alt=""
                width={1400}
                height={1100}
                className="w-full h-full rounded-2xl mt-2"
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

          <div className="flex-center flex-col w-[360px] h-[420px] rounded-2xl  shadow-xl  border-1 border-gray-100">
            <div className=" w-[97%] h-[60%] flex-center">
              <Image
                src="/assets/ai_description_3.png"
                alt=""
                width={1448}
                height={1086}
                className="w-full h-full rounded-2xl mt-2"
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
  )
}

export default DescriptionChatbot