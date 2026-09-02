import React from "react";
import Image from "next/image";
import Link from "next/link";
import { IoNotificationsOutline } from "react-icons/io5";
import { MdLockOutline } from "react-icons/md";
import { IoChatboxEllipsesOutline } from "react-icons/io5";
import { FaUserDoctor } from "react-icons/fa6";
import { IoIosArrowForward } from "react-icons/io";


const Dashboard = () => {
  return (
    <div className="flex justify-between flex-col h-full">
      <div className="flex justify-between my-8 w-[90%] mx-auto">
        <div>
          <h3 className="font-bold mb-2">Welcome back, Username</h3>
          <p className="font-medium text-gray-500">
            Here's your health overview for today.
          </p>
        </div>

        <div className="flex items-start gap-10">
          <IoNotificationsOutline className="mt-2 font-bold text-[24px]" />
          <div className="flex items-center gap-3">
            <div className="rounded-full w-10 h-10 bg-blue-50">
              <Image src="" w-full h-full alt="" />
            </div>
            <div>first last</div>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-[90%] mx-auto gap-y-5 mb-10">
        <div className="vitals"></div>
        <div className="summary flex gap-x-5 ">
          <div className="flex items-center justify-around basis-[70%] h-80 p-10 shadow-sm border border-ai rounded-xl bg-fourth/30">
            <div className="flex flex-col w-[400] h-full">
              <h4 className="font-bold text-lg flex items-center gap-2 mb-5">
                <Image
                  src="/assets/ai_green.png"
                  width={240}
                  height={240}
                  alt=""
                  className="w-5 h-5"
                />{" "}
                Pilot AI Insight
              </h4>
              <p className="font-semibold text-justify leading-relaxed indent-10">
                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Natus
                doloribus saepe sunt officia deleniti sint. Assumenda, iure.
                Architecto illo aut atque amet, ipsam sed reiciendis harum. Sit
                architecto consequatur assumenda cupiditate cumque veritatis sed
                perferendis unde officiis ullam! Labore obcaecati modi quae
                nulla.
              </p>
            </div>
            <div className="flex-center">
              <Image
                src="/assets/chatbot-img.png"
                width={1199}
                height={1312}
                alt=""
                className="w-60 h-70"
              />
            </div>
          </div>
          <div className="basis-[30%] h-80 bg-white shadow-sm border border-ai rounded-xl py-5 px-5">
            <h4 className="font-bold text-lg mb-3">Quick Actions</h4>
            <div className="flex flex-col">
              <Link
                href="/chatbot"
                className="flex justify-between items-center text-main font-bold bg-fourth/30 px-3 py-2 mb-2 rounded-lg "
              >
                <div>
                  <IoChatboxEllipsesOutline className="inline mr-2" />
                  Chat with Pilot AI
                </div>
              <IoIosArrowForward />
              </Link>
              <Link
                href=""
                className="flex justify-between items-center text-main font-bold bg-fourth/30 px-3 py-2 mb-2 rounded-lg "
              >
                <div>
                  <FaUserDoctor className="inline mr-2" />
                  Find a Doctor
                </div>
                <IoIosArrowForward />
              </Link>
            </div>
            <h4 className="font-bold text-lg mb-3">Recent Alerts</h4>
            <div className="bg-fourth/30 h-25 rounded-lg flex-center"></div>
          </div>
        </div>
        <div className="h-80 bg-white shadow-sm border border-ai rounded-xl px-10 py-5">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-lg">Recommended Doctors For You</h4>
            <button className=" text-main font-bold">view all</button>
          </div>
        </div>
      </div>

      <p className="flex-center gap-4 font-semibold text-[14px]">
        <MdLockOutline /> Your date is private and secure
      </p>
    </div>
  );
};

export default Dashboard;
